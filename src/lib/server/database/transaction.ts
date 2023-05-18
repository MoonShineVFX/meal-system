import { TransactionType, Prisma, PrismaClient } from '@prisma/client'

import { prisma } from './define'
import { settings, TransactionName } from '@/lib/common'
import {
  updateBlockchainByMintBurn,
  updateBlockchainByTransfer,
} from './blockchain'

/* Recharge */
type RechargeUserBalanceBaseArgs = {
  userId: string
  pointAmount?: number
  creditAmount?: number
  depositId?: string
  orderId?: number
  client?: Prisma.TransactionClient | PrismaClient
}
export async function rechargeUserBalanceBase({
  userId,
  pointAmount,
  creditAmount,
  depositId,
  orderId,
  client,
}: RechargeUserBalanceBaseArgs) {
  if (!pointAmount && !creditAmount) throw new Error('Amount is required')
  if (depositId && orderId)
    throw new Error('depositId and orderId are exclusive')

  const thisPrisma = client ?? prisma
  const type = orderId
    ? TransactionType.CANCELED
    : depositId
    ? TransactionType.DEPOSIT
    : TransactionType.RECHARGE

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
      pointAmount,
      creditAmount,
      type,
      depositId,
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

/* Refund */
type RefundUserBalanceBaseArgs = {
  userId: string
  amount: number
  depositId?: string // If excute from deposit update
  client?: Prisma.TransactionClient | PrismaClient
}
export async function refundUserBalanceBase({
  userId,
  amount,
  depositId,
  client,
}: RefundUserBalanceBaseArgs) {
  const thisPrisma = client ?? prisma

  const user = await thisPrisma.user.update({
    where: { id: userId },
    data: {
      creditBalance: {
        decrement: amount,
      },
    },
  })

  const transaction = await thisPrisma.transaction.create({
    data: {
      sourceUserId: settings.SERVER_USER_ID,
      targetUserId: userId,
      creditAmount: -amount,
      type: TransactionType.REFUND,
      depositId: depositId,
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

export async function refundUserBalance(
  args: Omit<RefundUserBalanceBaseArgs, 'client'>,
) {
  const { user, transaction, callback } = await prisma.$transaction(
    async (client) => {
      return await refundUserBalanceBase({
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

export async function getTransaction({
  transactionId,
}: {
  transactionId: number
}) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      sourceUser: { select: { name: true } },
      targetUser: { select: { name: true } },
      orderForCanceled: {
        select: {
          id: true,
          items: { select: { name: true, price: true, quantity: true } },
          menu: { select: { name: true, type: true, date: true } },
        },
      },
      ordersForPayment: {
        select: {
          id: true,
          items: { select: { name: true, price: true, quantity: true } },
          menu: { select: { name: true, type: true, date: true } },
        },
      },
      deposit: true,
    },
  })
  if (!transaction) throw new Error('Transaction not found')

  return transaction
}

export async function getTransactions({
  userId,
  keyword,
  cursor,
}: {
  userId: string
  keyword?: string
  cursor?: number
}) {
  let whereInput: Prisma.TransactionWhereInput = {}
  if (keyword && keyword !== '') {
    if (keyword.match(/^\#\d+$/)) {
      // Transaction ID
      const transactionId = parseInt(keyword.slice(1))
      whereInput = { id: transactionId }
    } else if (keyword.match(/^\#.+$/)) {
      // Deposit ID
      const thisId = keyword.slice(1)
      whereInput = {
        depositId: thisId,
      }
    } else if (keyword.match(/^[1-9]\d*$/)) {
      // Price amount
      const amount = parseInt(keyword)
      whereInput = {
        OR: [{ creditAmount: amount }, { pointAmount: amount }],
      }
    } else {
      // Check datetime format
      let keywordForDate = keyword
      if (keyword.match(/^\d{1,2}[\ \/\-]\d{1,2}$/)) {
        keywordForDate = `${new Date().getFullYear()} ${keyword}`
      } else if (keyword.match(/^\d{4}$/)) {
        keywordForDate = `${new Date().getFullYear()} ${keyword.slice(
          0,
          2,
        )}-${keyword.slice(2, 4)}`
      }
      const searchDate = new Date(keywordForDate)
      if (
        !isNaN(searchDate.getTime()) &&
        searchDate.getFullYear() > 2020 &&
        searchDate.getFullYear() < 2100
      ) {
        const searchDateStart = new Date(searchDate.setHours(0, 0, 0, 0))
        const searchDateEnd = new Date(searchDate.setHours(23, 59, 59, 999))
        whereInput = {
          createdAt: {
            gte: searchDateStart,
            lte: searchDateEnd,
          },
        }
      } else {
        // Transaction Type and User Name
        const filteredTypes = Object.entries(TransactionName)
          .filter(([, v]) => v.includes(keyword))
          .map(([k]) => k as TransactionType)
        if (filteredTypes) {
          whereInput = {
            OR: [
              {
                sourceUser: {
                  name: {
                    contains: keyword,
                  },
                },
              },
              {
                targetUser: {
                  name: {
                    contains: keyword,
                  },
                },
              },
              {
                type: {
                  in: filteredTypes,
                },
              },
            ],
          }
        } else {
          whereInput = {
            OR: [
              {
                sourceUser: {
                  name: {
                    contains: keyword,
                  },
                },
              },
              {
                targetUser: {
                  name: {
                    contains: keyword,
                  },
                },
              },
            ],
          }
        }
      }
    }
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      AND: [
        {
          OR: [
            {
              sourceUserId: userId,
              type: { in: [TransactionType.PAYMENT, TransactionType.TRANSFER] },
            },
            {
              targetUserId: userId,
              type: {
                in: [
                  TransactionType.DEPOSIT,
                  TransactionType.RECHARGE,
                  TransactionType.REFUND,
                  TransactionType.CANCELED,
                  TransactionType.TRANSFER,
                ],
              },
            },
          ],
        },
        whereInput,
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: settings.TRANSACTIONS_PER_QUERY + 1,
    cursor: cursor ? { id: cursor } : undefined,
    include: {
      sourceUser: { select: { name: true } },
      targetUser: { select: { name: true } },
    },
  })
  return transactions
}
