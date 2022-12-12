import z from 'zod'
import { MenuType } from '@prisma/client'

import { userProcedure, router } from '../trpc'
import { getMenu, createCartItem } from '@/lib/server/database'
import { Event, eventEmitter } from '@/lib/server/event'
import { EVENT_MESSAGE } from '@/lib/common'

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
        quantity: z.number(),
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
        Event.USER_MESSAGE(ctx.userLite.id),
        EVENT_MESSAGE.ADD_CART,
      )
    }),
})
