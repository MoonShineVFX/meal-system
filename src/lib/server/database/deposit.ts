import * as crypto from 'crypto'
import { DepositStatus } from '@prisma/client'

import { rechargeUserBalanceBase, refundUserBalanceBase } from './transaction'
import { createMPGRequest } from '@/lib/server/deposit/newebpay'
import { prisma, log } from './define'

export async function createDeposit(props: { userId: string; amount: number }) {
  const timeStamp = Date.now().toString(36)
  const userHash = crypto
    .createHash('sha256')
    .update(props.userId)
    .digest('hex')
    .substring(0, 4)
  const randomString = Math.random().toString(36).substring(2, 6)
  const depositId = `${timeStamp}${userHash}${randomString}`.toUpperCase()

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
    })

    if (!deposit) {
      throw new Error(`找不到訂單 ${props.id}`)
    }

    if (deposit.status === props.status) {
      log(`訂單 ${props.id} 狀態已更新過同狀態`)
      return
    }

    if (
      // Recharge
      props.status === DepositStatus.SUCCESS &&
      deposit.status === DepositStatus.PENDING
    ) {
      await rechargeUserBalanceBase({
        userId: deposit.userId,
        creditAmount: deposit.amount,
        depositId: deposit.id,
        client,
      })
    } else if (
      // Refund
      props.status === DepositStatus.REFUND &&
      deposit.status === DepositStatus.SUCCESS
    ) {
      await refundUserBalanceBase({
        userId: deposit.userId,
        amount: deposit.amount,
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
    })
  })
}

export async function deleteDeposit(id: string) {
  return await prisma.deposit.delete({
    where: { id },
  })
}
