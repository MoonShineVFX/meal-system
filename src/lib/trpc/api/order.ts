import { z } from 'zod'

import { userProcedure, router } from '../trpc'
import { createOrder, getOrders } from '@/lib/server/database'
import { SERVER_NOTIFY } from '@/lib/common'
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
        type: z.enum(['live', 'reservation', 'archived']),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await getOrders({ userId: ctx.userLite.id, type: input.type })
    }),
})
