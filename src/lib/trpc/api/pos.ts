import z from 'zod'

import {
  OrderTimeStatus,
  SERVER_NOTIFY,
  getResourceUrl,
  settings,
} from '@/lib/common'
import {
  completeDishedUpOrders,
  getLiveOrdersForPOS,
  getReservationOrdersForPOS,
  updateOrderStatus,
  updateOrdersStatus,
} from '@/lib/server/database'
import { ServerChannelName, eventEmitter } from '@/lib/server/event'
import webPusher from '@/lib/server/webpush'
import { router, staffProcedure } from '../trpc'

function generateOrderNotifyMessage(orderId: number, status: OrderTimeStatus) {
  switch (status) {
    case 'timePreparing':
      return `訂單 #${orderId} 已經開始製作`
    case 'timeCanceled':
      return `訂單 #${orderId} 已經取消`
    case 'timeCompleted':
      return `訂單 #${orderId} 已經完成`
    case 'timeDishedUp':
      return `訂單 #${orderId} 已經可以取餐`
  }
}

export const POSRouter = router({
  getLive: staffProcedure
    .input(
      z.object({
        type: z.union([z.literal('live'), z.literal('archived')]),
      }),
    )
    .query(async ({ input }) => {
      return await getLiveOrdersForPOS(input)
    }),
  getReservation: staffProcedure
    .input(
      z.object({
        type: z.union([
          z.literal('today'),
          z.literal('future'),
          z.literal('past'),
        ]),
      }),
    )
    .query(async ({ input }) => {
      return await getReservationOrdersForPOS(input)
    }),
  completeDishedUps: staffProcedure.mutation(async () => {
    const orders = await completeDishedUpOrders()

    eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
      type: SERVER_NOTIFY.POS_UPDATE,
      skipNotify: true,
    })

    let userIds: string[] = []
    for (const order of orders) {
      eventEmitter.emit(ServerChannelName.USER_NOTIFY(order.userId), {
        type: SERVER_NOTIFY.ORDER_UPDATE,
        message: generateOrderNotifyMessage(order.id, 'timeCompleted'),
        link: `/order/id/${order.id}`,
        skipNotify: true,
      })
      if (!userIds.includes(order.userId)) {
        userIds.push(order.userId)
      }
    }

    webPusher.pushBadgeCountToUser({
      userIds,
    })
  }),
  update: staffProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.union([
          z.literal('timePreparing'),
          z.literal('timeDishedUp'),
          z.literal('timeCompleted'),
          z.literal('timeCanceled'),
        ]),
      }),
    )
    .mutation(async ({ input }) => {
      const order = await updateOrderStatus(input)

      eventEmitter.emit(ServerChannelName.USER_NOTIFY(order.userId), {
        type:
          input.status !== 'timeCanceled'
            ? SERVER_NOTIFY.ORDER_UPDATE
            : SERVER_NOTIFY.ORDER_CANCEL,
        message: generateOrderNotifyMessage(order.id, input.status),
        link: `/order/id/${order.id}`,
        skipNotify: input.status === 'timeCompleted',
      })

      const orderImage = order.items.reduce(
        (prev: string | undefined, curr) => {
          if (prev) return prev
          return curr.image?.path
        },
        undefined,
      )

      if (input.status !== 'timeCompleted') {
        webPusher.pushNotificationToUser({
          userId: order.userId,
          title: '訂單更新',
          message: generateOrderNotifyMessage(order.id, input.status),
          icon: `${getResourceUrl('xs')}/image/${
            orderImage ?? settings.RESOURCE_FOOD_PLACEHOLDER
          }`,
          tag: `order-${order.id}`,
          url: `${settings.WEBSITE_URL}/order/id/${order.id}`,
          ignoreIfFocused: true,
        })
      }

      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.POS_UPDATE,
        skipNotify: true,
      })

      webPusher.pushBadgeCountToUser({
        userIds: [order.userId],
      })
    }),
  updateReservation: staffProcedure
    .input(
      z.object({
        orderIds: z.array(z.number()).min(1),
        status: z.union([
          z.literal('timePreparing'),
          z.literal('timeDishedUp'),
          z.literal('timeCompleted'),
          z.literal('timeCanceled'),
        ]),
      }),
    )
    .mutation(async ({ input }) => {
      const orders = await updateOrdersStatus(input)

      let userIds: string[] = []
      for (const order of orders) {
        eventEmitter.emit(ServerChannelName.USER_NOTIFY(order.userId), {
          type:
            input.status !== 'timeCanceled'
              ? SERVER_NOTIFY.ORDER_UPDATE
              : SERVER_NOTIFY.ORDER_CANCEL,
          message: generateOrderNotifyMessage(order.id, input.status),
          link: `/order/id/${order.id}`,
          skipNotify: input.status === 'timeCompleted',
        })

        if (!userIds.includes(order.userId)) {
          userIds.push(order.userId)
        }
      }

      webPusher.pushBadgeCountToUser({
        userIds,
      })

      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.POS_UPDATE,
        skipNotify: true,
      })
    }),
})
