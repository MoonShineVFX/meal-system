import { Menu, MenuType } from '@prisma/client'
import lzString from 'lz-string'
import z from 'zod'
import { optionValueSchema, settings } from '@/lib/common'
import { PUSHER_CHANNEL, PUSHER_EVENT } from '@/lib/common/pusher'
import {
  addCommodityToMenu,
  createCommodity,
  createOrUpdateSupplier,
  deleteMenu,
  getActiveMenus,
  getMenuWithComs,
  getReservationMenusForUser,
  getReservationMenusSince,
  getRetailCOM,
  prismaCient,
  removeCommoditiesFromMenu,
  upsertMenu,
  getOrderRecordsByUser,
} from '@/lib/server/database'
import { emitPusherEvent } from '@/lib/server/pusher'
import { updateMenuPublishNotifyEvent } from '@/lib/server/cronicle'
import { router, staffProcedure, userProcedure } from '../trpc'
import { getLogger } from '@/lib/server/logger'
import webPusher from '@/lib/server/webpush'

const log = getLogger('trpc.api.menu')

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

      let originalMenu: Menu | null = null
      if (input.id) {
        originalMenu = await prismaCient.menu.findUnique({
          where: {
            id: input.id,
          },
        })
      }

      const menu = await prismaCient.$transaction(async (client) => {
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

        return menu
      })

      // Emit events
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
        const message =
          input.closedDate === null ? '即時點餐已開放' : '即時點餐已關閉'

        emitPusherEvent(PUSHER_CHANNEL.PUBLIC, {
          type: PUSHER_EVENT.MENU_LIVE_UPDATE,
          skipNotify: !input.liveMenuNotify,
          message,
        })

        if (input.liveMenuNotify) {
          const users = await prismaCient.user.findMany({
            where: {
              isDeactivated: false,
              optMenuNotify: true,
            },
            select: {
              id: true,
            },
          })
          await Promise.all(
            users.map(
              async (user) =>
                await webPusher.pushNotificationToUser({
                  userId: user.id,
                  title: message,
                  message:
                    input.closedDate === null
                      ? '快來看看有什麼好吃的 🍜🍖🍱'
                      : '感謝您的捧場 🙏✨',
                  url: `${settings.WEBSITE_URL}/live`,
                  ignoreIfFocused: true,
                }),
            ),
          )
          log(`Sent ${users.length} notifications to users`)
        }
      }

      // Trigger task when date changed and is reservation menu
      if (
        isReservation &&
        (!originalMenu ||
          (originalMenu &&
            (originalMenu.publishedDate !== menu.publishedDate ||
              originalMenu.closedDate !== menu.closedDate)))
      ) {
        await updateMenuPublishNotifyEventToLatest()
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
      await updateMenuPublishNotifyEventToLatest()
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
      rateLimit: {
        perSecond: 50,
        perMinute: 5,
      },
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
        quantity: z.number().min(1).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await getRetailCOM({
        userId: ctx.userLite.id,
        cipher: input.cipher,
        quantity: input.quantity,
      })
    }),
  getOrderRecords: userProcedure
    .input(
      z.object({
        menuType: z.enum(['LIVE']),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await getOrderRecordsByUser({
        userId: ctx.userLite.id,
        menuType: input.menuType,
      })
    }),
})

export async function updateMenuPublishNotifyEventToLatest() {
  const now = new Date()
  const menus = await prismaCient.menu.findMany({
    where: {
      isDeleted: false,
      type: {
        notIn: ['LIVE', 'RETAIL'],
      },
      publishedDate: {
        gt: now,
      },
    },
    orderBy: [
      {
        publishedDate: 'asc',
      },
      {
        id: 'asc',
      },
    ],
    take: 1,
  })
  if (menus.length === 0) {
    await updateMenuPublishNotifyEvent({
      enabled: false,
    })
    log('No menus to update menu publish notify event to latest')
    return
  }

  const menu = menus[0]
  await updateMenuPublishNotifyEvent({
    menuId: menu.id,
    date: menu.publishedDate!,
  })

  log(`Updated menu publish notify event to latest for menu ${menu.id}`)
}
