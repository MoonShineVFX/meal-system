import { z } from 'zod'

import {
  createOrUpdateBonus,
  deleteBonus,
  getBonus,
} from '@/lib/server/database'
import { SERVER_NOTIFY } from '@/lib/common'
import { ServerChannelName, eventEmitter } from '@/lib/server/event'

import { router, staffProcedure } from '../trpc'

export const BonusRouter = router({
  createOrEdit: staffProcedure
    .input(
      z.object({
        id: z.number().optional(),
        amount: z.number().min(1),
        note: z.string().optional(),
        userIds: z.array(z.string()).min(1),
        validAt: z.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await createOrUpdateBonus(input)

      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: input.id ? SERVER_NOTIFY.BONUS_UPDATE : SERVER_NOTIFY.BONUS_ADD,
        skipNotify: true,
      })

      for (const userId of input.userIds) {
        eventEmitter.emit(ServerChannelName.USER_NOTIFY(userId), {
          type: SERVER_NOTIFY.BONUS_APPLY,
          skipNotify: true,
        })
      }
    }),
  delete: staffProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      await deleteBonus(input.id)

      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.BONUS_DELETE,
        skipNotify: true,
      })
    }),
  getList: staffProcedure
    .input(
      z.object({
        cursor: z.number().int().positive().optional(),
      }),
    )
    .query(async ({ input }) => {
      return await await getBonus({
        cursor: input.cursor,
      })
    }),
})
