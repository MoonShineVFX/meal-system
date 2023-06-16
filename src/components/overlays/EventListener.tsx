import { useEffect, useState, useRef } from 'react'
import * as BeamsWebClient from '@pusher/push-notifications-web'

import { useStore, NotificationType } from '@/lib/client/store'
import trpc, {
  onSocketOpenCallbacks,
  onSocketCloseCallbacks,
  onQueryMutationErrorCallbacks,
} from '@/lib/client/trpc'
import { SERVER_NOTIFY, settings } from '@/lib/common'

type BeamsToken = {
  token: string
}

class CustomBeamsTokenProvider {
  private readonly token: BeamsToken

  constructor(token: BeamsToken) {
    this.token = token
  }

  fetchToken(): Promise<BeamsToken> {
    return Promise.resolve(this.token)
  }
}

export default function EventListener() {
  const trpcContext = trpc.useContext()
  const addNotification = useStore((state) => state.addNotification)
  const serviceWorkerRegistration = useStore(
    (state) => state.serviceWorkerRegistration,
  )
  const [hasDisconnected, setHasDisconnected] = useState(false)
  const userInfoQuery = trpc.user.get.useQuery(undefined)
  const beamsClientRef = useRef<BeamsWebClient.Client | null>(null)
  const getUserBeamsToken = trpc.user.getBeamsToken.useMutation(undefined)

  /* Pusher Push Notifications Initialize */
  useEffect(() => {
    if (beamsClientRef.current && !userInfoQuery.data) {
      console.log('[Beams] Unregistering')
      beamsClientRef.current.stop()
      beamsClientRef.current = null
      return
    }

    if (!('serviceWorker' in navigator)) return
    if (beamsClientRef.current) return
    if (!serviceWorkerRegistration) return
    if (!userInfoQuery.data) return

    const beamsClient = new BeamsWebClient.Client({
      instanceId: settings.BEAMS_KEY,
      serviceWorkerRegistration: serviceWorkerRegistration,
    })
    beamsClientRef.current = beamsClient

    getUserBeamsToken.mutate(undefined, {
      onSuccess: (token) => {
        const tokenProvider = new CustomBeamsTokenProvider(token)
        beamsClient
          .start()
          .then(() =>
            beamsClient.setUserId(userInfoQuery.data.id, tokenProvider),
          )
          .then(() =>
            console.log(
              `[Beams] Successfully registered as ${userInfoQuery.data.id}`,
            ),
          )
          .catch((e) => console.error(`[Beams] ${e}`))
      },
    })
  }, [userInfoQuery.data, beamsClientRef, serviceWorkerRegistration])

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
          type: notifyPayload.notificationType ?? NotificationType.SUCCESS,
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
          trpcContext.transaction.getListByUser.invalidate()
          break
        case SERVER_NOTIFY.ORDER_UPDATE:
          trpcContext.order.get.invalidate()
          trpcContext.order.getCount.invalidate()
          break
        case SERVER_NOTIFY.ORDER_CANCEL:
          trpcContext.order.get.invalidate()
          trpcContext.user.get.invalidate()
          trpcContext.order.getCount.invalidate()
          trpcContext.transaction.getListByUser.invalidate()
          break
        case SERVER_NOTIFY.DEPOSIT_RECHARGE:
          trpcContext.user.get.invalidate()
          break

        // Staff & Admin
        case SERVER_NOTIFY.POS_ADD:
          trpcContext.pos.getLive.invalidate()
          trpcContext.pos.getReservation.invalidate()
          // Check if order is live, 這判斷有點勉強，之後可能需要改
          if (
            notifyPayload.link &&
            notifyPayload.link.startsWith('/pos/live')
          ) {
            const audio = new Audio(
              `${settings.RESOURCE_URL}/${settings.RESOURCE_NOTIFICATION_SOUND}`,
            )
            audio.play()
          }
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
        case SERVER_NOTIFY.COMMODITY_ADD:
        case SERVER_NOTIFY.COMMODITY_UPDATE:
        case SERVER_NOTIFY.COMMODITY_DELETE:
          trpcContext.commodity.getList.invalidate()
          break
        case SERVER_NOTIFY.OPTION_SETS_ADD:
        case SERVER_NOTIFY.OPTION_SETS_UPDATE:
        case SERVER_NOTIFY.OPTION_SETS_DELETE:
          trpcContext.optionSet.get.invalidate()
          break
        case SERVER_NOTIFY.MENU_ADD:
        case SERVER_NOTIFY.MENU_UPDATE:
        case SERVER_NOTIFY.MENU_DELETE:
          trpcContext.menu.get.invalidate()
          trpcContext.menu.getActives.invalidate()
          trpcContext.menu.getReservationsForUser.invalidate()
          break
        case SERVER_NOTIFY.DEPOSIT_UPDATE:
          trpcContext.deposit.getList.invalidate()
          break
        case SERVER_NOTIFY.SUPPLIER_ADD:
        case SERVER_NOTIFY.SUPPLIER_UPDATE:
        case SERVER_NOTIFY.SUPPLIER_DELETE:
          trpcContext.supplier.getList.invalidate()
          trpcContext.commodity.getList.invalidate()
          break
        case SERVER_NOTIFY.USER_SETTINGS_UPDATE:
          trpcContext.user.get.invalidate()
          break
      }
    },
  })

  return null
}
