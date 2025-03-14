import z from 'zod'
import { MenuType } from '@prisma/client'
import lzString from 'lz-string'

import { userProcedure, staffProcedure, router } from '../trpc'
import {
  getMenuWithComs,
  getReservationMenusForUser,
  getReservationMenusSince,
  getActiveMenus,
  prismaCient,
  upsertMenu,
  createCommodity,
  addCommodityToMenu,
  removeCommoditiesFromMenu,
  deleteMenu,
  getRetailCOM,
  createOrUpdateSupplier,
  getReservationStartToday,
} from '@/lib/server/database'
import { optionValueSchema } from '@/lib/common'
import { emitPusherEvent } from '@/lib/server/pusher'
import { PUSHER_EVENT, PUSHER_CHANNEL } from '@/lib/common/pusher'

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
                      options: z.array(optionValueSchema),
                      order: z.number(),
                    }),
                  ),
                })
                .optional(),
            }),
          )
          .optional(),
        createSupplier: z.boolean().optional(),
        supplierId: z.number().optional(),
        id: z.number().optional(),
        // XXX: 即時點餐開關通知，先這樣
        liveMenuNotify: z.boolean().optional(),
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

      if (input.isEdit && input.createSupplier) {
        throw new Error('編輯菜單時不可新增店家')
      }

      if (input.supplierId && input.createSupplier) {
        throw new Error('不可同時指定店家與新增店家')
      }

      await prismaCient.$transaction(async (client) => {
        let supplierId: number | undefined = input.supplierId
        // create supplier
        if (input.createSupplier) {
          if (!input.name) {
            throw new Error('請輸入店家名稱')
          }
          const supplier = await createOrUpdateSupplier({
            client,
            name: input.name,
            description: input.description,
          })
          supplierId = supplier.id
        }

        // create menu
        const menu = await upsertMenu({
          client,
          ...(input as Parameters<typeof upsertMenu>[0]),
          supplierId,
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
                    supplierId,
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
            excludeCommodityIds: coms.map((com) => com.commodityId),
          })
        }
      })

      const hasCreateCommodity =
        input.coms && input.coms.some((com) => 'commodity' in com)
      if (hasCreateCommodity) {
        emitPusherEvent(PUSHER_CHANNEL.STAFF, {
          type: PUSHER_EVENT.COMMODITY_ADD,
          skipNotify: true,
        })
      }

      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: input.isEdit ? PUSHER_EVENT.MENU_UPDATE : PUSHER_EVENT.MENU_ADD,
        skipNotify: false,
      })

      // Public channel notification
      if (input.type === 'LIVE') {
        emitPusherEvent(PUSHER_CHANNEL.PUBLIC, {
          type: PUSHER_EVENT.MENU_LIVE_UPDATE,
          skipNotify: !input.liveMenuNotify,
          message:
            input.closedDate !== null
              ? '即時點餐已關閉'
              : input.closedDate === null
              ? '即時點餐已開啟'
              : '即時點餐已更新',
        })
      } else if (input.type !== 'RETAIL') {
        emitPusherEvent(PUSHER_CHANNEL.PUBLIC, {
          type: PUSHER_EVENT.MENU_RESERVATION_UPDATE,
          skipNotify: true,
        })
      }
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
      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: PUSHER_EVENT.MENU_DELETE,
        skipNotify: false,
      })
    }),
  get: userProcedure
    .input(
      z.object({
        type: z.nativeEnum(MenuType).optional(),
        menuId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.menuId && !input.type) {
        throw new Error('menuId or type is required')
      }

      let menuId = input.menuId
      if (
        input.type &&
        ['LIVE', 'RETAIL'].includes(input.type) &&
        !input.menuId
      ) {
        const menu = await prismaCient.menu.findFirst({
          where: {
            type: input.type,
            isDeleted: false,
          },
        })
        if (menu) {
          menuId = menu.id
        }
      }

      if (!menuId) {
        throw new Error('Menu not found')
      }

      return await getMenuWithComs({
        menuId: menuId,
        userId: ctx.userLite.id,
      })
    }),
  getReservationsForUser: userProcedure
    .meta({
      rateLimitPoints: 5,
    })
    .query(async ({ ctx }) => {
      return await getReservationMenusForUser({ userId: ctx.userLite.id })
    }),
  getReservationsSince: staffProcedure
    .input(
      z.object({
        date: z.date(),
      }),
    )
    .query(async ({ input }) => {
      return await getReservationMenusSince({
        year: input.date.getFullYear(),
        month: input.date.getMonth() + 1,
      })
    }),
  getReservationStartToday: userProcedure.query(async () => {
    return await getReservationStartToday()
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
  getQRCodeCipher: staffProcedure
    .input(
      z.object({
        commodityId: z.number(),
        menuId: z.number(),
        options: z
          .record(z.union([optionValueSchema, z.array(optionValueSchema)]))
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      const jsonString = JSON.stringify(input)
      return lzString.compressToEncodedURIComponent(jsonString)
    }),
  getCOMFromQRCodeCipher: userProcedure
    .input(
      z.object({
        cipher: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await getRetailCOM({
        userId: ctx.userLite.id,
        cipher: input.cipher,
      })
    }),
})
