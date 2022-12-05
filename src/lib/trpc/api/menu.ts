import z from 'zod'
import { MenuType } from '@prisma/client'
import { TRPCError } from '@trpc/server'

import { userProcedure, router } from '../trpc'
import {
  getMenu,
  getCommoditiesOnMenu,
  getUserOrdersOnMenu,
} from '@/lib/server/database'

export const MenuRouter = router({
  get: userProcedure
    .input(
      z.object({
        type: z.nativeEnum(MenuType),
        date: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const menu = await getMenu(input.type, input.date)

      if (!menu) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'menu not found',
        })
      }

      const commoditiesOnMenu = await getCommoditiesOnMenu(menu.id)
      const userOrders = await getUserOrdersOnMenu(ctx.userLite.id, menu.id)

      return {
        menu,
        commoditiesOnMenu,
        userOrders,
      }
    }),
})
