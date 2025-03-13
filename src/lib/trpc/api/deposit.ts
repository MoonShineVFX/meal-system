import { DepositStatus, UserRole } from '@prisma/client'
import { z } from 'zod'

import { NotificationType } from '@/lib/client/store'
import { settings } from '@/lib/common'
import {
  createDeposit,
  deleteDeposit,
  getDeposit,
  getDeposits,
} from '@/lib/server/database'
import { getAndUpdateTradeInfo } from '@/lib/server/deposit/newebpay'
import { emitPusherEvent } from '@/lib/server/pusher'
import { router, staffProcedure, userProcedure } from '../trpc'
import { PUSHER_EVENT, PUSHER_CHANNEL } from '@/lib/common/pusher'

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
        notification: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const deposit = await getDeposit(input.id)
      if (!deposit) {
        throw new Error(`?��??�儲?��??? ${input.id}`)
      }

      if (
        deposit.userId !== ctx.userLite.id &&
        ctx.userLite.role === UserRole.USER
      ) {
        throw new Error(`沒�?讀?�此?�值�??��?權�?`)
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

      if (result && input.notification) {
        if (result.status === DepositStatus.SUCCESS) {
          emitPusherEvent(PUSHER_CHANNEL.USER(ctx.userLite.id), {
            type: PUSHER_EVENT.DEPOSIT_RECHARGE,
            link: `/transaction?t=${
              result.transactions[result.transactions.length - 1].id
            }`,
          })
        } else if (result.status === DepositStatus.FAILED) {
          emitPusherEvent(PUSHER_CHANNEL.USER(ctx.userLite.id), {
            type: PUSHER_EVENT.DEPOSIT_FAILED,
            notificationType: NotificationType.ERROR,
          })
        }
      }

      return {
        ...deposit,
        response: result ? result.response : null,
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
