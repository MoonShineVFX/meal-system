import z from 'zod'
import { MenuType } from '@prisma/client'

import { userProcedure, staffProcedure, router } from '../trpc'
import {
  getMenuWithComs,
  getReservationMenus,
  getActiveMenus,
  prismaCient,
  createMenu,
  createCommodity,
  addCommodityToMenu,
  removeCommoditiesFromMenu,
  deleteMenu,
} from '@/lib/server/database'
import { SERVER_NOTIFY } from '@/lib/common'
import { ServerChannelName, eventEmitter } from '@/lib/server/event'

export const MenuRouter = router({
  createOrEdit: staffProcedure
    .input(
      z.object({
        isEdit: z.boolean(),
        name: z.string().optional(),
        description: z.string().optional(),
        limitPerUser: z.number().optional(),
        type: z.nativeEnum(MenuType),
        date: z.date().nullable().optional(),
        publishedDate: z.date().nullable().optional(),
        closedDate: z.date().nullable().optional(),
        coms: z
          .array(
            z.object({
              commodityId: z.number(),
              stock: z.number(),
              limitPerUser: z.number(),
              commodity: z
                .object({
                  name: z.string(),
                  price: z.number(),
                  optionSets: z.array(
                    z.object({
                      name: z.string(),
                      multiSelect: z.boolean(),
                      options: z.array(z.string()),
                      order: z.number(),
                    }),
                  ),
                })
                .optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const isReservation = !['LIVE', 'RETAIL'].includes(input.type)
      if (
        isReservation &&
        (!input.date || !input.publishedDate || !input.closedDate)
      ) {
        throw new Error('預訂菜單需要日期參數')
      }

      await prismaCient.$transaction(async (client) => {
        // create menu
        const menu = await createMenu({
          client,
          ...(input as Parameters<typeof createMenu>[0]),
          isEdit: input.isEdit,
        })

        if (input.coms !== undefined) {
          // create commodities and replace temp id with new id
          const coms = await Promise.all(
            input.coms
              .filter(
                (com) =>
                  ('commodity' in com && com.commodity !== undefined) ||
                  !('commodity' in com),
              )
              .map(async (com) => {
                if ('commodity' in com) {
                  const thisCommodity = await createCommodity({
                    client,
                    ...com.commodity!,
                  })
                  return {
                    ...com,
                    commodityId: thisCommodity.id,
                  }
                }
                return com
              }),
          )

          // add commodities to menu
          await Promise.all(
            coms.map(async (com) => {
              await addCommodityToMenu({
                client,
                menuId: menu.id,
                commodityId: com.commodityId,
                stock: com.stock,
                limitPerUser: com.limitPerUser,
              })
            }),
          )

          // remove commodities from menu
          await removeCommoditiesFromMenu({
            client,
            menuId: menu.id,
            excludeCommodityIds: input.coms.map((com) => com.commodityId),
          })
        }
      })

      const hasCreateCommodity =
        input.coms && input.coms.some((com) => 'commodity' in com)
      if (hasCreateCommodity) {
        eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
          type: SERVER_NOTIFY.COMMODITY_ADD,
          skipNotify: true,
        })
      }

      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: input.isEdit ? SERVER_NOTIFY.MENU_UPDATE : SERVER_NOTIFY.MENU_ADD,
        skipNotify: false,
      })
    }),
  deleteMany: staffProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
      }),
    )
    .mutation(async ({ input }) => {
      await Promise.all(
        input.ids.map(async (id) => {
          await deleteMenu({ menuId: id })
        }),
      )
      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.MENU_DELETE,
        skipNotify: false,
      })
    }),
  get: userProcedure
    .input(
      z.object({
        type: z.nativeEnum(MenuType).optional(),
        date: z.date().optional(),
        menuId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.menuId && !input.type) {
        throw new Error('menuId or type is required')
      }
      if (input.type === 'LIVE' && input.date) {
        throw new Error('LIVE menu does not have a date')
      } else if (input.type !== 'LIVE' && !input.menuId && !input.date) {
        throw new Error('Date is required for non MAIN menu')
      }

      return await getMenuWithComs({
        menu: input.menuId
          ? { menuId: input.menuId! }
          : input.type === 'LIVE' || input.type === 'RETAIL'
          ? {
              type: input.type!,
            }
          : {
              type: input.type!,
              date: input.date!,
            },
        userId: ctx.userLite.id,
      })
    }),
  getReservations: userProcedure.query(async ({ ctx }) => {
    return await getReservationMenus({ userId: ctx.userLite.id })
  }),
  getActives: userProcedure
    .input(
      z.object({
        includeIds: z.array(z.number()).optional(),
        includeClosed: z.boolean().optional(),
        withDetails: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      return await getActiveMenus(input)
    }),
})
