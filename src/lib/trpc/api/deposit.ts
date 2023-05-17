import { z } from 'zod'
import { UserRole, DepositStatus } from '@prisma/client'

import { userProcedure, staffProcedure, router } from '../trpc'
import {
  createDeposit,
  deleteDeposit,
  getDeposit,
  getDeposits,
} from '@/lib/server/database'
import { SERVER_NOTIFY, settings } from '@/lib/common'
import { getAndUpdateTradeInfo } from '@/lib/server/deposit/newebpay'
import { ServerChannelName, eventEmitter } from '@/lib/server/event'
import { NotificationType } from '@/lib/client/store'

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
        throw new Error(`找不到儲值紀錄: ${input.id}`)
      }

      if (
        deposit.userId !== ctx.userLite.id &&
        ctx.userLite.role === UserRole.USER
      ) {
        throw new Error(`沒有讀取此儲值紀錄的權限`)
      }

      const result = await getAndUpdateTradeInfo({
        depositId: deposit.id,
        amount: deposit.amount,
      })

      if (result && result.status !== deposit.status) {
        eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
          type: SERVER_NOTIFY.DEPOSIT_UPDATE,
          skipNotify: true,
        })
      }

      if (result && input.notification) {
        if (result.status === DepositStatus.SUCCESS) {
          eventEmitter.emit(ServerChannelName.USER_NOTIFY(ctx.userLite.id), {
            type: SERVER_NOTIFY.DEPOSIT_RECHARGE,
            link: `/transaction/${
              result.transactions[result.transactions.length - 1].id
            }`,
          })
        } else if (result.status === DepositStatus.FAILED) {
          eventEmitter.emit(ServerChannelName.USER_NOTIFY(ctx.userLite.id), {
            type: SERVER_NOTIFY.DEPOSIT_FAILED,
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
