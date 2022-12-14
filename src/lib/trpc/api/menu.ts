import z from 'zod'
import { MenuType } from '@prisma/client'

import { userProcedure, router } from '../trpc'
import { getMenu, createCartItem, getCartItems } from '@/lib/server/database'
import { ServerEventName, eventEmitter } from '@/lib/server/event'
import { SERVER_NOTIFY, settings } from '@/lib/common'

export const MenuRouter = router({
  get: userProcedure
    .input(
      z.object({
        type: z.nativeEnum(MenuType),
        date: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const menu = await getMenu(
        input.type,
        input.date,
        undefined,
        ctx.userLite.id,
      )

      return menu
    }),
  addComToCart: userProcedure
    .input(
      z.object({
        menuId: z.number(),
        quantity: z.number().min(1).max(settings.MENU_MAX_ORDER_QUANTITY),
        commodityId: z.number(),
        options: z.record(z.union([z.string(), z.array(z.string())])),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await createCartItem(
        ctx.userLite.id,
        input.menuId,
        input.commodityId,
        input.quantity,
        input.options,
      )

      eventEmitter.emit(
        ServerEventName.USER_NOTIFY(ctx.userLite.id),
        SERVER_NOTIFY.ADD_CART,
      )
    }),
  getCart: userProcedure.query(async ({ ctx }) => {
    return await getCartItems(ctx.userLite.id)
  }),
})
