import z from 'zod'
import { MenuType } from '@prisma/client'

import { userProcedure, router } from '../trpc'
import { getMenuWithComs, getReservationMenus } from '@/lib/server/database'

export const MenuRouter = router({
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
})
