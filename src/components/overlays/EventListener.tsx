import { useEffect, useState } from 'react'

import { useStore, NotificationType } from '@/lib/client/store'
import trpc, {
  onSocketOpenCallbacks,
  onSocketCloseCallbacks,
  onQueryMutationErrorCallbacks,
} from '@/lib/client/trpc'
import { SERVER_NOTIFY } from '@/lib/common'

export default function EventListener() {
  const trpcContext = trpc.useContext()
  const addNotification = useStore((state) => state.addNotification)
  const [hasDisconnected, setHasDisconnected] = useState(false)
  const userInfoQuery = trpc.user.get.useQuery(undefined)

  /* Socket management */
  useEffect(() => {
    const handleError = async (error: Omit<Error, 'name'>) => {
      // Catch socket closed error
      if (error.message === 'WebSocket closed prematurely') {
        return
      }
      // Ignore error when not login
      if (!userInfoQuery.isSuccess) {
        return
      }
      addNotification({
        type: NotificationType.ERROR,
        message: error.message,
      })
    }
    const handleSocketOpen = async () => {
      if (!hasDisconnected) return
      console.warn('TRPC Socket Reopened')
      // Revalidate due to tanstack query not support websocket refetchOnReconnect
      trpcContext.invalidate()
      addNotification({
        type: NotificationType.INFO,
        message: '恢復連線',
      })
    }
    const handleSocketClose = async () => {
      console.warn('TRPC Socket Closed')
      setHasDisconnected(true)
      addNotification({
        type: NotificationType.ERROR,
        message: '連線中斷',
      })
    }
    onSocketCloseCallbacks.push(handleSocketClose)
    onSocketOpenCallbacks.push(handleSocketOpen)
    onQueryMutationErrorCallbacks.push(handleError)

    return () => {
      onSocketCloseCallbacks.splice(
        onSocketCloseCallbacks.indexOf(handleSocketClose),
        1,
      )
      onSocketOpenCallbacks.splice(
        onSocketOpenCallbacks.indexOf(handleSocketOpen),
        1,
      )
      onQueryMutationErrorCallbacks.splice(
        onQueryMutationErrorCallbacks.indexOf(handleError),
        1,
      )
    }
  }, [hasDisconnected, userInfoQuery.isSuccess, addNotification])

  /* Server Notification */
  trpc.user.onNotify.useSubscription(undefined, {
    onData: async (notifyPayload) => {
      if (!notifyPayload.skipNotify) {
        addNotification({
          type: NotificationType.SUCCESS,
          message: notifyPayload.message ?? notifyPayload.type,
          link: notifyPayload.link,
        })
      }

      switch (notifyPayload.type) {
        // User
        case SERVER_NOTIFY.CART_ADD:
        case SERVER_NOTIFY.CART_DELETE:
        case SERVER_NOTIFY.CART_UPDATE:
          trpcContext.menu.get.invalidate()
          trpcContext.cart.get.invalidate()
          break
        case SERVER_NOTIFY.ORDER_ADD:
          trpcContext.menu.get.invalidate()
          trpcContext.cart.get.invalidate()
          trpcContext.user.get.invalidate()
          trpcContext.order.get.invalidate()
          trpcContext.order.getCount.invalidate()
          trpcContext.transaction.get.invalidate()
          break
        case SERVER_NOTIFY.ORDER_UPDATE:
          trpcContext.order.get.invalidate()
          trpcContext.order.getCount.invalidate()
          break
        case SERVER_NOTIFY.ORDER_CANCEL:
          trpcContext.order.get.invalidate()
          trpcContext.user.get.invalidate()
          trpcContext.order.getCount.invalidate()
          trpcContext.transaction.get.invalidate()
          break

        // Staff
        case SERVER_NOTIFY.POS_ADD:
          trpcContext.pos.getLive.invalidate()
          trpcContext.pos.getReservation.invalidate()
          break
        case SERVER_NOTIFY.POS_UPDATE:
          trpcContext.pos.getLive.invalidate()
          trpcContext.pos.getReservation.invalidate()
          break
        case SERVER_NOTIFY.CATEGORY_ADD:
        case SERVER_NOTIFY.CATEGORY_UPDATE:
        case SERVER_NOTIFY.CATEGORY_DELETE:
          trpcContext.category.get.invalidate()
          break
        case SERVER_NOTIFY.COMMODITY_UPDATE:
          trpcContext.commodity.get.invalidate()
          break
      }
    },
  })

  return null
}
