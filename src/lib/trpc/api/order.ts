import { userProcedure, router } from '../trpc'
import { createOrder, getOrders } from '@/lib/server/database'
import { SERVER_NOTIFY } from '@/lib/common'
import { ServerEventName, eventEmitter } from '@/lib/server/event'

export const OrderRouter = router({
  add: userProcedure.mutation(async ({ ctx }) => {
    await createOrder({ userId: ctx.userLite.id })

    eventEmitter.emit(
      ServerEventName.USER_NOTIFY(ctx.userLite.id),
      SERVER_NOTIFY.ORDER_ADD,
    )
  }),
  get: userProcedure.query(async ({ ctx }) => {
    return await getOrders({ userId: ctx.userLite.id })
  }),
})
