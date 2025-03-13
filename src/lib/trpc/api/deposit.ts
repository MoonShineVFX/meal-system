import { UserRole } from '@prisma/client'
import { z } from 'zod'

import { settings } from '@/lib/common'
import { PUSHER_CHANNEL, PUSHER_EVENT } from '@/lib/common/pusher'
import {
  createDeposit,
  deleteDeposit,
  getDeposit,
  getDeposits,
} from '@/lib/server/database'
import { getAndUpdateTradeInfo } from '@/lib/server/deposit/newebpay'
import { emitPusherEvent } from '@/lib/server/pusher'
import { router, staffProcedure, userProcedure } from '../trpc'

export const DepositRouter = router({
  create: userProcedure
    .input(
      z.object({
        amount: z
          .number()
          .int()
          .positive()
          .min(settings.DEPOSIT_MIN_AMOUNT)
          .max(settings.DEPOSIT_MAX_AMOUNT),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await createDeposit({
        userId: ctx.userLite.id,
        amount: input.amount,
      })
    }),
  delete: userProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await deleteDeposit(input.id)
    }),
  get: userProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const deposit = await getDeposit(input.id)
      if (!deposit) {
        throw new Error(`交易不存在 ${input.id}`)
      }

      if (
        deposit.userId !== ctx.userLite.id &&
        ctx.userLite.role === UserRole.USER
      ) {
        throw new Error(`沒有讀取此交易的權限`)
      }

      const result = await getAndUpdateTradeInfo({
        depositId: deposit.id,
        amount: deposit.amount,
      })

      if (result && result.status !== deposit.status) {
        emitPusherEvent(PUSHER_CHANNEL.STAFF, {
          type: PUSHER_EVENT.DEPOSIT_UPDATE,
          skipNotify: true,
        })
      }

      return {
        ...deposit,
        response: result ? result.response : null,
        resultStatus: result?.status,
      }
    }),
  getList: staffProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        keyword: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const deposits = await getDeposits({
        cursor: input.cursor,
        keyword: input.keyword ? input.keyword.trim() : undefined,
      })

      let nextCursor: string | undefined = undefined
      if (deposits.length > settings.DEPOSITS_PER_QUERY) {
        nextCursor = deposits.pop()!.id
      }
      return {
        deposits,
        nextCursor,
      }
    }),
  getMeta: userProcedure.query(async () => {
    return {
      ratio: settings.DEPOSIT_RATIO,
      point: settings.POINT_DAILY_RECHARGE_AMOUNT,
    }
  }),
})
