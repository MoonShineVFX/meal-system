import { userProcedure, router } from '../trpc'
import { createOrder } from '@/lib/server/database'
import { SERVER_NOTIFY } from '@/lib/common'
import { ServerEventName, eventEmitter } from '@/lib/server/event'

export const OrderRouter = router({
  add: userProcedure.mutation(async ({ ctx }) => {
    console.time('createOrder')
    await createOrder({ userId: ctx.userLite.id })
    console.timeEnd('createOrder')

    eventEmitter.emit(
      ServerEventName.USER_NOTIFY(ctx.userLite.id),
      SERVER_NOTIFY.ORDER_ADD,
    )
  }),
})
