import z from 'zod'
import { MenuType } from '@prisma/client'

import { userProcedure, staffProcedure, router } from '../trpc'
import {
  getMenuWithComs,
  getReservationMenus,
  getActiveMenus,
} from '@/lib/server/database'

export const MenuRouter = router({
  create: staffProcedure
    .input(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        limitPerUser: z.number().optional(),
        type: z.nativeEnum(MenuType),
        date: z.date().optional(),
        publishedDate: z.date().optional(),
        closedDate: z.date().optional(),
        coms: z.array(
          z.object({
            commodityId: z.number(),
            commodity: z.object({
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
            }),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const isReservation = ['LIVE', 'RETAIL'].includes(input.type)
      if (
        isReservation &&
        (!input.date || !input.publishedDate || !input.closedDate)
      ) {
        throw new Error('預訂菜單需要日期參數')
      }
      // TODO: database function
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
