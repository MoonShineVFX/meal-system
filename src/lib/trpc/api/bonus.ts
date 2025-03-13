import { z } from 'zod'

import {
  createOrUpdateBonus,
  deleteBonus,
  getBonus,
} from '@/lib/server/database'
import { PUSHER_EVENT, PUSHER_CHANNEL } from '@/lib/common/pusher'
import { emitPusherEvent } from '@/lib/server/pusher'

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

      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: input.id ? PUSHER_EVENT.BONUS_UPDATE : PUSHER_EVENT.BONUS_ADD,
        skipNotify: true,
      })

      for (const userId of input.userIds) {
        emitPusherEvent(PUSHER_CHANNEL.USER(userId), {
          type: PUSHER_EVENT.BONUS_APPLY,
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

      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: PUSHER_EVENT.BONUS_DELETE,
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
