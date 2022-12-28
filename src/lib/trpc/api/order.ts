import { z } from 'zod'

import { userProcedure, router } from '../trpc'
import { createOrder, getOrders, getOrdersCount } from '@/lib/server/database'
import { SERVER_NOTIFY, settings } from '@/lib/common'
import { ServerChannelName, eventEmitter } from '@/lib/server/event'

export const OrderRouter = router({
  add: userProcedure.mutation(async ({ ctx }) => {
    const orders = await createOrder({ userId: ctx.userLite.id })

    eventEmitter.emit(ServerChannelName.USER_NOTIFY(ctx.userLite.id), {
      type: SERVER_NOTIFY.ORDER_ADD,
    })

    for (const order of orders) {
      // notify when menu type is main
      if (order.menu.type === 'MAIN') {
        eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
          type: SERVER_NOTIFY.POS_ADD,
          message: `${order.user.name} 新增了一筆訂單`,
        })
      }
    }

    return orders
  }),
  get: userProcedure
    .input(
      z.object({
        cursor: z.number().optional(),
        type: z.enum(['live', 'reservation', 'archived', 'search']),
        keyword: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.type === 'search' && !input.keyword) return { orders: [] }

      const args =
        input.type === 'search'
          ? { keyword: input.keyword!.trim(), type: input.type }
          : { type: input.type }

      const orders = await getOrders({
        userId: ctx.userLite.id,
        cursor: input.cursor,
        ...args,
      })

      let nextCursor: number | undefined = undefined
      if (orders.length > settings.ORDER_TAKE_PER_QUERY) {
        const lastOrder = orders.pop()
        nextCursor = lastOrder!.id
      }

      return {
        orders,
        nextCursor,
      }
    }),
  getCount: userProcedure.query(async ({ ctx }) => {
    return await getOrdersCount({ userId: ctx.userLite.id })
  }),
})
