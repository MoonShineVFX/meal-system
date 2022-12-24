import z from 'zod'

import { staffProcedure, router } from '../trpc'
import { getOrdersForPOS, updateOrderStatus } from '@/lib/server/database'
import { SERVER_NOTIFY } from '@/lib/common'
import { ServerChannelName, eventEmitter } from '@/lib/server/event'

export const POSRouter = router({
  get: staffProcedure.query(async ({ ctx }) => {
    return await getOrdersForPOS()
  }),
  update: staffProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.union([
          z.literal('timePreparing'),
          z.literal('timeCanceled'),
          z.literal('timeClosed'),
          z.literal('timeCompleted'),
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
        case 'timeClosed':
          message = `訂單 #${order.id} 已經完成`
          break
        case 'timeCompleted':
          message = `訂單 #${order.id} 已經可以取餐`
          break
      }

      eventEmitter.emit(ServerChannelName.USER_NOTIFY(order.userId), {
        type: SERVER_NOTIFY.ORDER_UPDATE,
        message,
      })
      eventEmitter.emit(ServerChannelName.STAFF_NOTIFY, {
        type: SERVER_NOTIFY.POS_UPDATE,
        skipNotify: true,
      })
    }),
})
