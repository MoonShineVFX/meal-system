import z from 'zod'
import { MenuType } from '@prisma/client'

import { userProcedure, router } from '../trpc'
import { getMenuWithComs } from '@/lib/server/database'

export const MenuRouter = router({
  get: userProcedure
    .input(
      z.object({
        type: z.nativeEnum(MenuType),
        date: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.type === 'MAIN' && input.date) {
        throw new Error('MAIN menu does not have a date')
      } else if (input.type !== 'MAIN' && !input.date) {
        throw new Error('Date is required for non MAIN menu')
      }

      return await getMenuWithComs({
        menu:
          input.type === 'MAIN'
            ? {
                type: input.type,
              }
            : {
                type: input.type,
                date: input.date!,
              },
        userId: ctx.userLite.id,
      })
    }),
})
