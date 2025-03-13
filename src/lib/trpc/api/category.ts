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
import { PUSHER_EVENT, PUSHER_CHANNEL } from '@/lib/common/pusher'
import { emitPusherEvent } from '@/lib/server/pusher'

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
      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: PUSHER_EVENT.CATEGORY_ADD,
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
      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: PUSHER_EVENT.CATEGORY_UPDATE,
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
      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: PUSHER_EVENT.CATEGORY_UPDATE,
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
      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: PUSHER_EVENT.CATEGORY_DELETE,
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
      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: PUSHER_EVENT.CATEGORY_UPDATE,
        skipNotify: true,
      })
      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: PUSHER_EVENT.COMMODITY_UPDATE,
        skipNotify: true,
      })
    }),
})
