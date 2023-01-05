import z from 'zod'

import { staffProcedure, router } from '../trpc'
import {
  getLiveOrdersForPOS,
  getReservationOrdersForPOS,
  updateOrderStatus,
  updateOrdersStatus,
} from '@/lib/server/database'
import { SERVER_NOTIFY, OrderStatus } from '@/lib/common'
import { ServerChannelName, eventEmitter } from '@/lib/server/event'

function generateOrderNotifyMessage(orderId: number, status: OrderStatus) {
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
        type: z.union([z.literal('today'), z.literal('future')]),
      }),
    )
    .query(async ({ input }) => {
      return await getReservationOrdersForPOS(input)
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
      })
      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.POS_UPDATE,
        skipNotify: true,
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

      for (const order of orders) {
        eventEmitter.emit(ServerChannelName.USER_NOTIFY(order.userId), {
          type:
            input.status !== 'timeCanceled'
              ? SERVER_NOTIFY.ORDER_UPDATE
              : SERVER_NOTIFY.ORDER_CANCEL,
          message: generateOrderNotifyMessage(order.id, input.status),
          link: `/order/id/${order.id}`,
        })
      }

      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.POS_UPDATE,
        skipNotify: true,
      })
    }),
})