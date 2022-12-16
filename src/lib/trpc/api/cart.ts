import z from 'zod'

import { userProcedure, router } from '../trpc'
import {
  createOrUpdateCartItem,
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
      await createOrUpdateCartItem(
        ctx.userLite.id,
        input.menuId,
        input.commodityId,
        input.quantity,
        input.options,
      )

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
      await createOrUpdateCartItem(
        ctx.userLite.id,
        input.menuId,
        input.commodityId,
        input.quantity,
        input.options,
        input.optionsKey,
      )

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
      await deleteCartItems(ctx.userLite.id, input.ids, input.invalidOnly)
      eventEmitter.emit(
        ServerEventName.USER_NOTIFY(ctx.userLite.id),
        SERVER_NOTIFY.CART_DELETE,
      )
    }),
})
