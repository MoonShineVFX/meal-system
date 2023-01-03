import z from 'zod'

import { staffProcedure, router } from '../trpc'
import { getOrdersForPOS, updateOrderStatus } from '@/lib/server/database'
import { SERVER_NOTIFY } from '@/lib/common'
import { ServerChannelName, eventEmitter } from '@/lib/server/event'

export const POSRouter = router({
  get: staffProcedure
    .input(
      z.object({
        type: z.union([
          z.literal('live'),
          z.literal('reservation'),
          z.literal('archived'),
        ]),
      }),
    )
    .query(async ({ input }) => {
      return await getOrdersForPOS(input)
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

      let message: string | undefined = undefined
      switch (input.status) {
        case 'timePreparing':
          message = `訂單 #${order.id} 已經開始製作`
          break
        case 'timeCanceled':
          message = `訂單 #${order.id} 已經取消`
          break
        case 'timeCompleted':
          message = `訂單 #${order.id} 已經完成`
          break
        case 'timeDishedUp':
          message = `訂單 #${order.id} 已經可以取餐`
          break
      }

      eventEmitter.emit(ServerChannelName.USER_NOTIFY(order.userId), {
        type:
          input.status !== 'timeCanceled'
            ? SERVER_NOTIFY.ORDER_UPDATE
            : SERVER_NOTIFY.ORDER_CANCEL,
        message,
        link: `/order/id/${order.id}`,
      })
      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.POS_UPDATE,
        skipNotify: true,
      })
    }),
})
