import * as crypto from 'crypto'
import { DepositStatus, Prisma } from '@prisma/client'

import { rechargeUserBalanceBase, refundUserBalanceBase } from './transaction'
import { createMPGRequest } from '@/lib/server/deposit/newebpay'
import { prisma, log } from './define'
import { settings } from '@/lib/common'

export async function createDeposit(props: { userId: string; amount: number }) {
  const timeStamp = Date.now().toString(36)
  const userHash = crypto
    .createHash('sha256')
    .update(props.userId)
    .digest('hex')
    .substring(0, 4)
  const randomString = Math.random().toString(36).substring(2, 6)
  const depositId = `${timeStamp}${userHash}${randomString}`.toUpperCase()

  const user = await prisma.user.findUnique({
    where: { id: props.userId },
  })
  if (!user) {
    throw new Error(`找不到使用者 ${props.userId}`)
  }

  await prisma.deposit.create({
    data: {
      id: depositId,
      userId: props.userId,
      amount: props.amount,
    },
  })

  const result = await createMPGRequest({
    depositId,
    amount: props.amount,
    email: user.email !== null ? user.email : undefined,
  })

  return {
    ...result,
    depositId,
  }
}

export async function updateDeposit(props: {
  status: DepositStatus
  payTime: Date
  paymentType: string
  id: string
}) {
  return await prisma.$transaction(async (client) => {
    const deposit = await client.deposit.findUnique({
      where: { id: props.id },
      include: {
        transactions: true,
      },
    })

    if (!deposit) {
      throw new Error(`找不到訂單 ${props.id}`)
    }

    if (deposit.status === props.status) {
      log(`訂單 ${props.id} 狀態已更新過同狀態`)
      return deposit
    }

    if (
      // Recharge
      props.status === DepositStatus.SUCCESS &&
      deposit.status === DepositStatus.PENDING
    ) {
      await rechargeUserBalanceBase({
        userId: deposit.userId,
        creditAmount: deposit.amount * settings.DEPOSIT_RATIO,
        depositId: deposit.id,
        client,
      })
    } else if (
      // Refund
      props.status === DepositStatus.REFUND &&
      deposit.status === DepositStatus.SUCCESS
    ) {
      const chargeTransaction = await client.transaction.findFirst({
        where: {
          depositId: deposit.id,
          type: 'DEPOSIT',
        },
      })

      if (!chargeTransaction) {
        throw new Error(`找不到訂單 ${props.id} 的儲值紀錄，無法退款`)
      }

      await refundUserBalanceBase({
        userId: deposit.userId,
        amount: chargeTransaction.creditAmount,
        depositId: deposit.id,
        client,
      })
    } else {
      log(
        `沒有對應的訂單狀態更新 ${props.id} ${deposit.status} -> ${props.status}`,
      )
    }

    return client.deposit.update({
      where: { id: props.id },
      data: {
        status: props.status,
        payTime: props.payTime,
        paymentType: props.paymentType,
      },
      include: {
        transactions: true,
      },
    })
  })
}

export async function getDeposit(id: string) {
  return await prisma.deposit.findUnique({
    where: { id },
    include: {
      transactions: true,
    },
  })
}

export async function getDeposits({
  keyword,
  cursor,
}: {
  keyword?: string
  cursor?: string
}) {
  let whereInput: Prisma.DepositWhereInput = {}

  if (keyword && keyword !== '') {
    if (keyword.match(/^\#.+$/)) {
      // Deposit ID
      const thisId = keyword.slice(1)
      whereInput = {
        id: {
          contains: thisId,
        },
      }
    } else if (keyword.match(/^[1-9]\d*$/)) {
      // Price amount
      const amount = parseInt(keyword)
      whereInput = {
        amount,
      }
    } else {
      console.log('else')
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
        whereInput = {
          user: {
            name: {
              contains: keyword,
            },
          },
        }
      }
    }
  }

  const deposits = await prisma.deposit.findMany({
    where: whereInput,
    orderBy: {
      createdAt: 'desc',
    },
    take: settings.DEPOSITS_PER_QUERY + 1,
    cursor: cursor ? { id: cursor } : undefined,
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  })
  return deposits
}

export async function deleteDeposit(id: string) {
  return await prisma.deposit.delete({
    where: { id },
  })
}
