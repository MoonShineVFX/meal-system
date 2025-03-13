import z from 'zod'

import { userProcedure, router } from '../trpc'
import {
  createCartItem,
  updateCartItem,
  getCartItems,
  deleteCartItems,
} from '@/lib/server/database'
import { emitPusherEvent } from '@/lib/server/pusher'
import { PUSHER_EVENT, PUSHER_CHANNEL } from '@/lib/common/pusher'
import { settings, optionValueSchema } from '@/lib/common'

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
      const cartItem = await createCartItem({
        userId: ctx.userLite.id,
        menuId: input.menuId,
        commodityId: input.commodityId,
        quantity: input.quantity,
        options: input.options,
      })

      emitPusherEvent(PUSHER_CHANNEL.USER(ctx.userLite.id), {
        type: PUSHER_EVENT.CART_ADD,
        message: `新增 ${cartItem.commodityOnMenu.commodity.name} 至購物車`,
        link: '/cart',
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
      const cartItem = await updateCartItem({
        userId: ctx.userLite.id,
        menuId: input.menuId,
        commodityId: input.commodityId,
        quantity: input.quantity,
        options: input.options,
        previousOptionsKey: input.optionsKey,
      })

      emitPusherEvent(PUSHER_CHANNEL.USER(ctx.userLite.id), {
        type: PUSHER_EVENT.CART_UPDATE,
        message: `購物車的 ${cartItem.commodityOnMenu.commodity.name} 已更新`,
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
      emitPusherEvent(PUSHER_CHANNEL.USER(ctx.userLite.id), {
        type: PUSHER_EVENT.CART_DELETE,
      })
    }),
})
