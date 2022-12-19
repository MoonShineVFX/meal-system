import { UserRole, TransactionType, Prisma, Order } from '@prisma/client'

import { prisma } from './define'
import { settings, CurrencyType } from '@/lib/common'
import {
  updateBlockchainByMintBurn,
  updateBlockchainByTransfer,
} from './blockchain'

export async function rechargeUserBalance(
  userId: string,
  amount: number,
  type: CurrencyType,
  twmpResultId?: string, // If excute from twmp update
) {
  // Add target user balance and create recharge record
  const [user, transaction] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        creditBalance: {
          increment: type === CurrencyType.CREDIT ? amount : 0,
        },
        pointBalance: {
          increment: type === CurrencyType.POINT ? amount : 0,
        },
      },
    }),
    prisma.transaction.create({
      data: {
        sourceUserId: settings.SERVER_USER_ID,
        targetUserId: userId,
        creditAmount: amount,
        type: TransactionType.RECHARGE,
        twmpResultId: twmpResultId,
      },
      include: {
        sourceUser: { select: { name: true } },
        targetUser: { select: { name: true } },
      },
    }),
  ])

  // Update blockchain
  updateBlockchainByMintBurn(transaction.id)

  return {
    user,
    transaction,
  }
}

export async function refundUserBalance(
  userId: string,
  amount: number,
  twmpResultId?: string, // If excute from twmp update
) {
  // Burn target user balance even negative and create refund record
  const [user, transaction] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        creditBalance: {
          decrement: amount,
        },
      },
    }),
    prisma.transaction.create({
      data: {
        sourceUserId: settings.SERVER_USER_ID,
        targetUserId: userId,
        creditAmount: -amount,
        type: TransactionType.REFUND,
        twmpResultId: twmpResultId,
      },
      include: {
        sourceUser: { select: { name: true } },
        targetUser: { select: { name: true } },
      },
    }),
  ])

  // Update blockchain
  updateBlockchainByMintBurn(transaction.id)

  return {
    user,
    transaction,
  }
}

/** If orderQuery provided, create order */
export async function chargeUserBalance(
  userId: string,
  amount: number,
  orderQuery?: Prisma.OrderItemCreateManyOrderInput[],
) {
  // Charge user and create charge record
  const [user, transaction, order] = await prisma.$transaction(
    async (client) => {
      /* Validate */
      // Check user has enough balance
      const user = await client.user.findUnique({
        where: { id: userId },
      })
      if (!user) throw new Error('User not found')

      // Calculate charge amount
      let pointAmountToPay = 0
      let creditAmountToPay = 0

      pointAmountToPay = Math.min(amount, user.pointBalance)
      creditAmountToPay = amount - pointAmountToPay

      if (creditAmountToPay > user.creditBalance)
        throw new Error('Not enough credits')

      /* Operation */
      // Charge user
      const updatedUser = await client.user.update({
        where: {
          id: userId,
        },
        data: {
          creditBalance: { decrement: creditAmountToPay },
          pointBalance: { decrement: pointAmountToPay },
        },
      })

      const transaction = await client.transaction.create({
        data: {
          sourceUserId: userId,
          targetUserId: settings.SERVER_USER_ID,
          pointAmount: pointAmountToPay,
          creditAmount: creditAmountToPay,
          type: TransactionType.PAYMENT,
        },
        include: {
          sourceUser: {
            select: {
              name: true,
            },
          },
          targetUser: {
            select: {
              name: true,
            },
          },
        },
      })

      // Create order
      let order: Order | undefined = undefined
      if (orderQuery) {
        order = await client.order.create({
          data: {
            userId: userId,
            transactions: {
              connect: { id: transaction.id },
            },
            items: {
              createMany: {
                data: orderQuery,
              },
            },
          },
        })

        await client.cartItem.deleteMany({
          where: { userId: userId },
        })
      }

      return [updatedUser, transaction, order]
    },
  )

  // Update blockchain
  updateBlockchainByTransfer(transaction.id)

  return {
    user,
    transaction,
    order,
  }
}

export async function getTransactions(
  userId: string | undefined,
  cursor: number | undefined,
  role: UserRole,
) {
  let whereQuery: Prisma.TransactionWhereInput
  if (role === UserRole.USER) {
    whereQuery = {
      OR: [
        {
          sourceUserId: userId,
          type: { in: [TransactionType.PAYMENT] },
        },
        {
          targetUserId: userId,
          type: { in: [TransactionType.RECHARGE, TransactionType.REFUND] },
          creditAmount: { not: 0 },
        },
      ],
    }
  } else if (role === UserRole.STAFF) {
    whereQuery = {
      targetUserId: settings.SERVER_USER_ID,
      type: TransactionType.PAYMENT,
    }
  } else if (role === UserRole.ADMIN) {
    // Filter auto recharge
    whereQuery = {
      NOT: {
        sourceUserId: settings.SERVER_USER_ID,
        type: TransactionType.RECHARGE,
        pointAmount: {
          gt: 0,
        },
      },
    }
  } else {
    throw new Error('Invalid role')
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      AND: [whereQuery],
    },
    orderBy: {
      id: 'desc',
    },
    include: {
      sourceUser: {
        select: {
          name: true,
        },
      },
      targetUser: {
        select: {
          name: true,
        },
      },
    },
    take: settings.TRANSACTIONS_PER_PAGE + 1,
    cursor: cursor ? { id: cursor } : undefined,
  })
  return transactions
}
