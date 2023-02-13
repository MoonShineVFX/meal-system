import z from 'zod'

import {
  getCommodities,
  createCommodity,
  addCommodityToMenu,
} from '@/lib/server/database'
import { staffProcedure, router } from '../trpc'
import { SERVER_NOTIFY } from '@/lib/common'
import { ServerChannelName, eventEmitter } from '@/lib/server/event'

export const CommodityRouter = router({
  create: staffProcedure
    .input(
      z.object({
        name: z.string(),
        price: z.number(),
        description: z.string().optional(),
        optionSets: z
          .array(
            z.object({
              name: z.string(),
              multiSelect: z.boolean(),
              options: z.array(z.string()),
              order: z.number(),
            }),
          )
          .optional(),
        categoryIds: z.array(z.number()).optional(),
        imageId: z.string().optional(),
        menus: z
          .array(
            z.object({
              menuId: z.number(),
              stock: z.number(),
              limitPerUser: z.number(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const commodity = await createCommodity(input)
      if (input.menus) {
        await Promise.all(
          input.menus.map((menu) =>
            addCommodityToMenu({ ...menu, commodityId: commodity.id }),
          ),
        )
      }
      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.COMMODITY_ADD,
        skipNotify: false,
      })
    }),
  get: staffProcedure.query(async () => {
    return await getCommodities()
  }),
})
