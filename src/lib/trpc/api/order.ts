import { z } from 'zod'

import { settings, validateAuthority } from '@/lib/common'
import {
  createOrderFromCart,
  createOrderFromRetail,
  getOrders,
  getOrdersCount,
  updateOrderStatus,
} from '@/lib/server/database'
import { queue } from '@/lib/server/queue'
import webPusher from '@/lib/server/webpush'
import { UserAuthority } from '@prisma/client'

import { PUSHER_CHANNEL, PUSHER_EVENT } from '@/lib/common/pusher'
import { emitPusherEvent, emitPusherWebhook } from '@/lib/server/pusher'
import { router, staffProcedure, userProcedure } from '../trpc'

export const OrderRouter = router({
  addFromCart: userProcedure
    .meta({
      rateLimit: {
        perSecond: 100,
      },
    })
    .input(
      z.object({
        clientOrder: z.boolean().optional(),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userLite) throw new Error('未登入')

      if (input.clientOrder) {
        const canClientOrder = validateAuthority(
          ctx.userLite,
          UserAuthority.CLIENT_ORDER,
        )
        if (!canClientOrder) throw new Error('權限不足')
      }

      const orders = await queue.add(async () => {
        return await createOrderFromCart({
          userId: ctx.userLite.id,
          ...input,
        })
      })

      if (!orders) throw new Error('訂單新增失敗')

      for (const order of orders) {
        // notify when menu type is main
        if (order.menu.type === 'LIVE') {
          emitPusherEvent(PUSHER_CHANNEL.STAFF, {
            type: PUSHER_EVENT.POS_ADD,
            message: `${order.user.name} 新增了一筆訂單`,
            link: `/pos/live`,
          })
        } else if (order.menu.date) {
          emitPusherEvent(PUSHER_CHANNEL.STAFF, {
            type: PUSHER_EVENT.POS_ADD,
            skipNotify: true,
          })
        }

        // notify webhook
        emitPusherWebhook('ORDER_ADD', order)
      }

      webPusher.pushBadgeCountToUser({
        userIds: [ctx.userLite.id],
      })

      return orders
    }),
  addFromRetail: userProcedure
    .meta({
      rateLimit: {
        perSecond: 100,
      },
    })
    .input(
      z.object({
        cipher: z.string(),
        quantity: z.number().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userLite) throw new Error('未登入')

      const order = await createOrderFromRetail({
        userId: ctx.userLite.id,
        cipher: input.cipher,
        quantity: input.quantity,
      })

      // notify webhook
      emitPusherWebhook('ORDER_ADD', order)

      return order
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

      return getOrdersWithCursor({
        userId: ctx.userLite.id,
        cursor: input.cursor,
        ...args,
      })
    }),
  getList: staffProcedure
    .input(
      z.object({
        cursor: z.number().int().positive().optional(),
        keyword: z.string().optional(),
        onlyClientOrder: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getOrdersWithCursor({
        cursor: input.cursor,
        keyword: input.keyword ? input.keyword.trim() : '',
        type: 'search',
        onlyClientOrder: input.onlyClientOrder,
      })
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

      emitPusherEvent(PUSHER_CHANNEL.USER(order.userId), {
        type:
          input.type === 'complete'
            ? PUSHER_EVENT.ORDER_UPDATE
            : PUSHER_EVENT.ORDER_CANCEL,
        message: `訂單 #${order.id} 已經${typeString}`,
        link: `/order/id/${order.id}`,
        skipNotify: input.type === 'complete',
      })
      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: PUSHER_EVENT.POS_UPDATE,
        message: `${ctx.userLite.name} ${typeString}訂單 #${order.id}`,
        skipNotify: input.type === 'complete',
      })

      webPusher.pushBadgeCountToUser({
        userIds: [ctx.userLite.id],
      })
    }),
  getBadgeCount: userProcedure.query(async ({ ctx }) => {
    return await getOrdersCount({
      userId: ctx.userLite.id,
    })
  }),
})

async function getOrdersWithCursor(props: Parameters<typeof getOrders>[0]) {
  const orders = await getOrders(props)

  let nextCursor: number | undefined = undefined
  if (orders.length > settings.ORDER_TAKE_PER_QUERY) {
    const lastOrder = orders.pop()
    nextCursor = lastOrder!.id
  }

  return {
    orders,
    nextCursor,
  }
}
