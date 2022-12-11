import z from 'zod'
import { MenuType } from '@prisma/client'

import { userProcedure, router } from '../trpc'
import { getMenu } from '@/lib/server/database'

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
})
