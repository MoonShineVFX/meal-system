import { UserRole, TransactionType, Prisma, PrismaClient } from '@prisma/client'

import { prisma } from './define'
import { settings } from '@/lib/common'
import {
  updateBlockchainByMintBurn,
  updateBlockchainByTransfer,
} from './blockchain'

type RechargeUserBalanceBaseArgs = {
  userId: string
  pointAmount?: number
  creditAmount?: number
  twmpResultId?: string
  orderId?: number
  client?: Prisma.TransactionClient | PrismaClient
}
export async function rechargeUserBalanceBase({
  userId,
  pointAmount,
  creditAmount,
  twmpResultId,
  orderId,
  client,
}: RechargeUserBalanceBaseArgs) {
  if (!pointAmount && !creditAmount) throw new Error('Amount is required')
  if (twmpResultId && orderId)
    throw new Error('twmpResultId and orderId are exclusive')

  const thisPrisma = client ?? prisma
  const type = orderId ? TransactionType.CANCELED : TransactionType.RECHARGE

  const user = await thisPrisma.user.update({
    where: { id: userId },
    data: {
      creditBalance: {
        increment: creditAmount ?? 0,
      },
      pointBalance: {
        increment: pointAmount ?? 0,
      },
    },
  })
  const transaction = await thisPrisma.transaction.create({
    data: {
      sourceUserId: settings.SERVER_USER_ID,
      targetUserId: userId,
      pointAmount: pointAmount,
      creditAmount: creditAmount,
      type,
      twmpResultId,
      orderForCanceled: orderId
        ? {
            connect: {
              id: orderId,
            },
          }
        : undefined,
    },
    include: {
      sourceUser: { select: { name: true } },
      targetUser: { select: { name: true } },
    },
  })

  const callback = () => updateBlockchainByMintBurn(transaction.id)

  return {
    user,
    transaction,
    callback,
  }
}

export async function rechargeUserBalance(
  args: Omit<RechargeUserBalanceBaseArgs, 'client'>,
) {
  // Add target user balance and create recharge record
  const { user, transaction, callback } = await prisma.$transaction(
    async (client) => {
      return await rechargeUserBalanceBase({
        ...args,
        client,
      })
    },
  )
  callback()

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

/** Charge User Balance */
type ChargeUserBalanceArgs = {
  userId: string
  amount: number
}
export async function chargeUserBalanceBase({
  userId,
  amount,
  client,
}: ChargeUserBalanceArgs & {
  client: Prisma.TransactionClient | PrismaClient
}) {
  const thisPrisma = client ?? prisma
  /* Validate */
  // Check user has enough balance
  const user = await thisPrisma.user.findUnique({
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
  const updatedUser = await thisPrisma.user.update({
    where: {
      id: userId,
    },
    data: {
      creditBalance: { decrement: creditAmountToPay },
      pointBalance: { decrement: pointAmountToPay },
    },
  })

  const transaction = await thisPrisma.transaction.create({
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

  return { user: updatedUser, transaction }
}
export async function chargeUserBalance({
  userId,
  amount,
}: ChargeUserBalanceArgs) {
  // Charge user and create charge record
  const { user, transaction } = await prisma.$transaction(async (client) => {
    return await chargeUserBalanceBase({
      userId,
      amount,
      client,
    })
  })

  // Update blockchain
  updateBlockchainByTransfer(transaction.id)

  return {
    user,
    transaction,
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
