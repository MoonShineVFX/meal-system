import z from 'zod'

import { SERVER_NOTIFY, optionValueSchema } from '@/lib/common'
import {
  addCommodityToMenu,
  createCommodity,
  deleteCommodities,
  editCommodity,
  getCommodities,
  removeCommodityFromMenus,
} from '@/lib/server/database'
import { ServerChannelName, eventEmitter } from '@/lib/server/event'
import { router, staffProcedure } from '../trpc'

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
              options: z.array(optionValueSchema),
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
        supplierId: z.number().optional(),
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
  update: staffProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        price: z.number().optional(),
        description: z.string().optional(),
        optionSets: z
          .array(
            z.object({
              name: z.string(),
              multiSelect: z.boolean(),
              options: z.array(optionValueSchema),
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
        supplierId: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const commodity = await editCommodity(input)
      if (input.menus) {
        await Promise.all(
          input.menus.map((menu) =>
            addCommodityToMenu({ ...menu, commodityId: commodity.id }),
          ),
        )
      }
      await removeCommodityFromMenus({
        commodityId: commodity.id,
        excludeMenuIds: input.menus?.map((menu) => menu.menuId) ?? [],
      })
      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.COMMODITY_UPDATE,
        skipNotify: false,
      })
    }),
  updateMany: staffProcedure
    .input(
      z.array(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          price: z.number().optional(),
          description: z.string().optional(),
          optionSets: z
            .array(
              z.object({
                name: z.string(),
                multiSelect: z.boolean(),
                options: z.array(optionValueSchema),
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
      ),
    )
    .mutation(async ({ input }) => {
      const commodities = await Promise.all(
        input.map((editArgs) => editCommodity(editArgs)),
      )
      await Promise.all(
        commodities.flatMap((commodity) => {
          const editArgs = input.find((args) => args.id === commodity.id)
          if (editArgs?.menus) {
            return [
              ...editArgs.menus.map((menu) =>
                addCommodityToMenu({
                  ...menu,
                  commodityId: commodity.id,
                }),
              ),
              removeCommodityFromMenus({
                commodityId: commodity.id,
                excludeMenuIds: editArgs.menus.map((menu) => menu.menuId),
              }),
            ]
          }
        }),
      )

      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.COMMODITY_UPDATE,
        skipNotify: false,
      })
    }),
  getList: staffProcedure
    .input(
      z.object({
        includeMenus: z.boolean().optional(),
        includeIds: z.array(z.number()).optional(),
        onlyFromSupplierId: z.number().optional(),
        includeStatistics: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      return await getCommodities(input)
    }),
  deleteMany: staffProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
      }),
    )
    .mutation(async ({ input }) => {
      await deleteCommodities(input)
      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.COMMODITY_DELETE,
        skipNotify: false,
      })
    }),
})
