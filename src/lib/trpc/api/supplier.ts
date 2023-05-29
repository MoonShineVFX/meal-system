import { z } from 'zod'

import { staffProcedure, router } from '../trpc'
import {
  createOrUpdateSupplier,
  getSuppliers,
  deleteSuppliers,
} from '@/lib/server/database'
import { SERVER_NOTIFY } from '@/lib/common'
import { ServerChannelName, eventEmitter } from '@/lib/server/event'

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

      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: input.id
          ? SERVER_NOTIFY.SUPPLIER_UPDATE
          : SERVER_NOTIFY.SUPPLIER_ADD,
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

      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.SUPPLIER_DELETE,
        skipNotify: true,
      })

      return deleted
    }),
})
