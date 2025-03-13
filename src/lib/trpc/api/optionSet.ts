import z from 'zod'

import { staffProcedure, router } from '../trpc'
import {
  getOptionSetsTemplates,
  updateOptionSetsTemplate,
  updateOptionSetsOrders,
  deleteOptionSets,
  createOptionSetsTemplate,
} from '@/lib/server/database'
import { optionValueSchema } from '@/lib/common'
import { emitPusherEvent } from '@/lib/server/pusher'
import { PUSHER_EVENT, PUSHER_CHANNEL } from '@/lib/common/pusher'

const OptionSetSchema = z.array(
  z.object({
    name: z.string(),
    multiSelect: z.boolean(),
    order: z.number(),
    options: z.array(optionValueSchema),
  }),
)

export const OptionSetRouter = router({
  get: staffProcedure.query(async () => {
    return await getOptionSetsTemplates()
  }),
  create: staffProcedure
    .input(
      z.object({
        name: z.string(),
        optionSets: OptionSetSchema.optional(),
        order: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await createOptionSetsTemplate(input)
      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: PUSHER_EVENT.OPTION_SETS_ADD,
        skipNotify: true,
      })
    }),
  update: staffProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        optionSets: OptionSetSchema.optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await updateOptionSetsTemplate(input)
      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: PUSHER_EVENT.OPTION_SETS_UPDATE,
        skipNotify: true,
      })
    }),
  updateOrders: staffProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
      }),
    )
    .mutation(async ({ input }) => {
      await updateOptionSetsOrders(input)
    }),
  deleteMany: staffProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
      }),
    )
    .mutation(async ({ input }) => {
      await deleteOptionSets(input)
      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: PUSHER_EVENT.OPTION_SETS_DELETE,
        skipNotify: true,
      })
    }),
})
