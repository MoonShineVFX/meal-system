import { useEffect, useCallback } from 'react'

import { useStore, NotificationType } from '@/lib/client/store'
import trpc, {
  onSocketOpenCallbacks,
  onSocketCloseCallbacks,
} from '@/lib/client/trpc'
import { SERVER_NOTIFY } from '@/lib/common'

export default function EventListener() {
  const trpcContext = trpc.useContext()
  const addNotification = useStore((state) => state.addNotification)

  const handleError = useCallback(async (error: Omit<Error, 'name'>) => {
    // Catch socket closed error
    if (error.message === 'WebSocket closed prematurely') {
      return
    }
    addNotification({
      type: NotificationType.ERROR,
      message: error.message,
    })
  }, [])

  /* Socket management */
  useEffect(() => {
    const handleSocketOpen = async () => {
      console.warn('TRPC Socket reopened')
      // Revalidate due to tanstack query not support websocket refetchOnReconnect
      trpcContext.invalidate()
      addNotification({
        type: NotificationType.INFO,
        message: '恢復連線',
      })
    }
    const handleSocketClose = async () => {
      console.warn('TRPC Socket closed')
      addNotification({
        type: NotificationType.ERROR,
        message: '連線中斷',
      })
    }
    onSocketCloseCallbacks.push(handleSocketClose)
    onSocketOpenCallbacks.push(handleSocketOpen)

    return () => {
      onSocketCloseCallbacks.splice(
        onSocketCloseCallbacks.indexOf(handleSocketClose),
        1,
      )
      onSocketOpenCallbacks.splice(
        onSocketOpenCallbacks.indexOf(handleSocketOpen),
        1,
      )
    }
  }, [])

  /* Server Notification */
  trpc.user.onNotify.useSubscription(undefined, {
    onData: async (message) => {
      addNotification({
        type: NotificationType.SUCCESS,
        message: message,
      })

      switch (message) {
        case SERVER_NOTIFY.ADD_CART:
          trpcContext.menu.get.invalidate()
          break
      }
    },
    onError: handleError,
  })

  return null
}
