import z from 'zod'
import { MenuType } from '@prisma/client'
import { TRPCError } from '@trpc/server'

import { userProcedure, router } from '../trpc'
import { getMenu, getCommoditiesOnMenu } from '@/lib/server/database'

export const MenuRouter = router({
  get: userProcedure
    .input(
      z.object({
        type: z.nativeEnum(MenuType),
        date: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const menu = await getMenu(input.type, ctx.userLite.id, input.date)

      if (!menu) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'menu not found',
        })
      }

      const commoditiesOnMenu = await getCommoditiesOnMenu(
        menu.id,
        ctx.userLite.id,
      )

      return {
        menu,
        commoditiesOnMenu,
      }
    }),
})
