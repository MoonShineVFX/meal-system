import { TwmpResultStatus } from '@prisma/client'

import { CurrencyType } from '@/lib/common'
import { prisma, log } from './define'
import { createTwmp, getTwmp } from '@/lib/server/twmp'
import { rechargeUserBalance, refundUserBalance } from './transaction'

export async function createTwmpDeposit(
  userId: string,
  amount: number,
  callbackHost?: string,
) {
  let twmpDeposit = await prisma.twmpDeposit.create({
    data: {
      userId: userId,
      transAMT: amount,
    },
  })

  const response = await createTwmp(twmpDeposit.orderNo, amount, callbackHost)

  twmpDeposit = await prisma.twmpDeposit.update({
    where: { orderNo: twmpDeposit.orderNo },
    data: {
      txnID: response.txnID,
      callbackUrl: 'twmpUrl' in response ? response.twmpUrl : undefined,
      qrcode: 'qrcode' in response ? response.qrcode : undefined,
    },
  })

  return twmpDeposit
}

export async function updateTwmpDeposit(
  orderNo: string,
  txnUID: string,
  status: TwmpResultStatus,
  time: Date,
) {
  const existTwmpResult = await prisma.twmpResult.findUnique({
    where: {
      txnUID: txnUID,
    },
  })

  if (
    existTwmpResult &&
    existTwmpResult.status === status &&
    existTwmpResult.updatedAt === time
  ) {
    console.warn(`TWMP result already updated: ${txnUID}`)
    return existTwmpResult
  }

  const twmpResult = await prisma.twmpResult.upsert({
    where: {
      txnUID: txnUID,
    },
    update: {
      status: status,
      updatedAt: time,
    },
    create: {
      depositId: orderNo,
      txnUID: txnUID,
      status: status,
      createdAt: time,
      updatedAt: time,
    },
    include: {
      deposit: {
        select: {
          transAMT: true,
          userId: true,
        },
      },
    },
  })

  if (status === TwmpResultStatus.SUCCESS) {
    // Recharge user
    await rechargeUserBalance(
      twmpResult.deposit.userId,
      twmpResult.deposit.transAMT,
      CurrencyType.CREDIT,
      txnUID,
    )
  } else if (status === TwmpResultStatus.CANCELED) {
    // Refund user
    await refundUserBalance(
      twmpResult.deposit.userId,
      twmpResult.deposit.transAMT,
      txnUID,
    )
  }

  log(
    `TWMP Deposit [${orderNo}] Result [${txnUID}] status changed to ${status}`,
  )
}

export async function getTwmpDeposit(twmpDepositId: string) {
  log(`Get TWMP Deposit [${twmpDepositId}]`)
  let twmpDeposit = await prisma.twmpDeposit.findUnique({
    where: {
      orderNo: twmpDepositId,
    },
    include: {
      results: true,
    },
  })

  if (!twmpDeposit) return null
  if (!twmpDeposit.txnID) throw new Error('TWMP txnID not found')

  if (twmpDeposit.results.length === 0) {
    log(`TWMP Deposit [${twmpDepositId}] Result not found, fetching...`)
    try {
      const response = await getTwmp(twmpDeposit.txnID)
      for (const detail of response.detail) {
        await updateTwmpDeposit(
          twmpDeposit.orderNo,
          detail.txnUID,
          detail.status,
          detail.time,
        )
      }

      twmpDeposit = await prisma.twmpDeposit.findUnique({
        where: {
          orderNo: twmpDepositId,
        },
        include: {
          results: true,
        },
      })
    } catch (error) {
      log(`TWMP Deposit [${twmpDepositId}] update failed: ${error}`)
    }
  }

  return twmpDeposit
}
