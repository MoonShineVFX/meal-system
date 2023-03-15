import { z } from 'zod'

import { userProcedure, router } from '../trpc'
import {
  createOrder,
  getOrders,
  getOrdersCount,
  updateOrderStatus,
} from '@/lib/server/database'
import { SERVER_NOTIFY, settings } from '@/lib/common'
import { ServerChannelName, eventEmitter } from '@/lib/server/event'

export const OrderRouter = router({
  add: userProcedure.mutation(async ({ ctx }) => {
    const orders = await createOrder({ userId: ctx.userLite.id })

    eventEmitter.emit(ServerChannelName.USER_NOTIFY(ctx.userLite.id), {
      type: SERVER_NOTIFY.ORDER_ADD,
      link: `/order/id/${orders[0].id}`,
    })

    for (const order of orders) {
      // notify when menu type is main
      if (order.menu.type === 'LIVE') {
        eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
          type: SERVER_NOTIFY.POS_ADD,
          message: `${order.user.name} 新增了一筆訂單`,
          link: `/pos/live`,
        })
      } else if (order.menu.date) {
        eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
          type: SERVER_NOTIFY.POS_ADD,
          skipNotify: true,
        })
      }
    }

    return orders
  }),
  get: userProcedure
    .input(
      z.object({
        cursor: z.number().int().positive().optional(),
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
  update: userProcedure
    .input(
      z.object({
        orderId: z.number(),
        type: z.union([z.literal('cancel'), z.literal('complete')]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await updateOrderStatus({
        orderId: input.orderId,
        status: input.type === 'complete' ? 'timeCompleted' : 'timeCanceled',
        userId: ctx.userLite.id,
      })

      const typeString = input.type === 'complete' ? '完成' : '取消'

      eventEmitter.emit(ServerChannelName.USER_NOTIFY(order.userId), {
        type:
          input.type === 'complete'
            ? SERVER_NOTIFY.ORDER_UPDATE
            : SERVER_NOTIFY.ORDER_CANCEL,
        message: `訂單 #${order.id} 已經${typeString}`,
        link: `/order/id/${order.id}`,
      })
      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.POS_UPDATE,
        message: `${ctx.userLite.name} ${typeString}訂單 #${order.id}`,
      })
    }),
  getCount: userProcedure.query(async ({ ctx }) => {
    return await getOrdersCount({ userId: ctx.userLite.id })
  }),
})
