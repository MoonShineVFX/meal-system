import { z } from 'zod'

import { PUSHER_CHANNEL, PUSHER_EVENT } from '@/lib/common/pusher'
import {
  createOrUpdateSupplier,
  deleteSuppliers,
  getSuppliers,
} from '@/lib/server/database'
import { emitPusherEvent } from '@/lib/server/pusher'
import { router, staffProcedure } from '../trpc'

export const SupplierRouter = router({
  createOrEdit: staffProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        id: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const supplier = await createOrUpdateSupplier(input)

      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: input.id
          ? PUSHER_EVENT.SUPPLIER_UPDATE
          : PUSHER_EVENT.SUPPLIER_ADD,
        skipNotify: true,
      })

      return supplier
    }),
  getList: staffProcedure
    .input(
      z.object({
        countCOMs: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      return await getSuppliers(input)
    }),
  deleteMany: staffProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
      }),
    )
    .mutation(async ({ input }) => {
      const deleted = await deleteSuppliers(input)

      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: PUSHER_EVENT.SUPPLIER_DELETE,
        skipNotify: true,
      })

      return deleted
    }),
})
