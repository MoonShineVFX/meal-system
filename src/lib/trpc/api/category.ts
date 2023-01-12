import z from 'zod'

import { staffProcedure, router } from '../trpc'
import {
  getCategories,
  updateCategoriesOrders,
  createCategory,
  updateCategory,
  deleteCategories,
  updateSubCategoriesRoot,
  updateCategoryCommodities,
} from '@/lib/server/database'
import { SERVER_NOTIFY } from '@/lib/common'
import { ServerChannelName, eventEmitter } from '@/lib/server/event'

export const CategoryRouter = router({
  get: staffProcedure.query(async () => {
    return await getCategories()
  }),
  create: staffProcedure
    .input(
      z.object({
        name: z.string(),
        rootId: z.number().optional(),
        order: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await createCategory(input)
      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.CATEGORY_ADD,
        skipNotify: true,
      })
    }),
  update: staffProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        type: z.union([z.literal('root'), z.literal('sub')]),
      }),
    )
    .mutation(async ({ input }) => {
      await updateCategory(input)
      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.CATEGORY_UPDATE,
        skipNotify: true,
      })
    }),
  updateOrders: staffProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        type: z.union([z.literal('root'), z.literal('sub')]),
      }),
    )
    .mutation(async ({ input }) => {
      await updateCategoriesOrders(input)
    }),
  updateRoot: staffProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        rootId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      await updateSubCategoriesRoot(input)
      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.CATEGORY_UPDATE,
        skipNotify: true,
      })
    }),
  deleteMany: staffProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        type: z.union([z.literal('root'), z.literal('sub')]),
      }),
    )
    .mutation(async ({ input }) => {
      await deleteCategories(input)
      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.CATEGORY_DELETE,
        skipNotify: true,
      })
    }),
  updateCommodities: staffProcedure
    .input(
      z.object({
        id: z.number(),
        commodityIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input }) => {
      await updateCategoryCommodities(input)
      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.CATEGORY_UPDATE,
        skipNotify: true,
      })
      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.COMMODITY_UPDATE,
        skipNotify: true,
      })
    }),
})
