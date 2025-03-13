import z from 'zod'

import { optionValueSchema, settings } from '@/lib/common'
import {
  createCartItem,
  deleteCartItems,
  getCartItems,
  updateCartItem,
} from '@/lib/server/database'
import { router, userProcedure } from '../trpc'

export const CartRouter = router({
  add: userProcedure
    .input(
      z.object({
        menuId: z.number(),
        quantity: z.number().min(1).max(settings.MENU_MAX_QUANTITY_PER_ORDER),
        commodityId: z.number(),
        options: z.record(
          z.union([optionValueSchema, z.array(optionValueSchema)]),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await createCartItem({
        userId: ctx.userLite.id,
        menuId: input.menuId,
        commodityId: input.commodityId,
        quantity: input.quantity,
        options: input.options,
      })
    }),
  get: userProcedure.query(async ({ ctx }) => {
    return await getCartItems(ctx.userLite.id)
  }),
  update: userProcedure
    .input(
      z.object({
        menuId: z.number(),
        quantity: z.number().min(1).max(settings.MENU_MAX_QUANTITY_PER_ORDER),
        commodityId: z.number(),
        options: z.record(
          z.union([optionValueSchema, z.array(optionValueSchema)]),
        ),
        optionsKey: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await updateCartItem({
        userId: ctx.userLite.id,
        menuId: input.menuId,
        commodityId: input.commodityId,
        quantity: input.quantity,
        options: input.options,
        previousOptionsKey: input.optionsKey,
      })
    }),
  delete: userProcedure
    .input(
      z.object({
        ids: z
          .array(
            z.object({
              menuId: z.number(),
              commodityId: z.number(),
              optionsKey: z.string(),
            }),
          )
          .optional(),
        invalidOnly: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const deleteArgs =
        input.ids && input.ids.length > 0
          ? { ids: input.ids }
          : { invalidOnly: input.invalidOnly }
      await deleteCartItems({ userId: ctx.userLite.id, ...deleteArgs })
    }),
})
