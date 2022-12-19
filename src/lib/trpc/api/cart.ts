import z from 'zod'

import { userProcedure, router } from '../trpc'
import {
  createCartItem,
  updateCartItem,
  getCartItems,
  deleteCartItems,
} from '@/lib/server/database'
import { ServerEventName, eventEmitter } from '@/lib/server/event'
import { SERVER_NOTIFY, settings } from '@/lib/common'

export const CartRouter = router({
  add: userProcedure
    .input(
      z.object({
        menuId: z.number(),
        quantity: z.number().min(1).max(settings.MENU_MAX_QUANTITY_PER_ORDER),
        commodityId: z.number(),
        options: z.record(z.union([z.string(), z.array(z.string())])),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await createCartItem({
        userId: ctx.userLite.id,
        menuId: input.menuId,
        commodityId: input.commodityId,
        quantity: input.quantity,
        options: input.options,
      })

      eventEmitter.emit(
        ServerEventName.USER_NOTIFY(ctx.userLite.id),
        SERVER_NOTIFY.CART_ADD,
      )
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
        options: z.record(z.union([z.string(), z.array(z.string())])),
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

      eventEmitter.emit(
        ServerEventName.USER_NOTIFY(ctx.userLite.id),
        SERVER_NOTIFY.CART_UPDATE,
      )
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
      eventEmitter.emit(
        ServerEventName.USER_NOTIFY(ctx.userLite.id),
        SERVER_NOTIFY.CART_DELETE,
      )
    }),
})
