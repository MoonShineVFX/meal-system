import { useEffect, useState } from 'react'

import { useStore, NotificationType } from '@/lib/client/store'
import trpc, {
  onSocketOpenCallbacks,
  onSocketCloseCallbacks,
  onQueryMutationErrorCallbacks,
} from '@/lib/client/trpc'
import { SERVER_NOTIFY, settings } from '@/lib/common'

export default function EventListener() {
  const trpcContext = trpc.useContext()
  const addNotification = useStore((state) => state.addNotification)
  const webpushState = useStore((state) => state.webpushEnabled_local)
  const setWebpushState = useStore((state) => state.setWebpushState)
  const serviceWorkerRegistration = useStore(
    (state) => state.serviceWorkerRegistration,
  )
  const [hasDisconnected, setHasDisconnected] = useState(false)
  const userInfoQuery = trpc.user.get.useQuery(undefined)
  const addUserSubscriptionMutation = trpc.user.addSubscription.useMutation()
  const deleteUserSubscriptionMutation =
    trpc.user.deleteSubscription.useMutation()

  /* Pusher Push Notifications Initialize */
  useEffect(() => {
    if (!serviceWorkerRegistration) return

    serviceWorkerRegistration.pushManager
      .getSubscription()
      .then((subscription) => {
        // Unsubscribe if user disable webpush or user is not login
        if (!webpushState || userInfoQuery.isError) {
          setWebpushState(false)
          if (subscription) {
            console.debug('Push Notifications Unsubscribed', subscription)
            const endpoint = subscription.toJSON().endpoint
            if (endpoint) deleteUserSubscriptionMutation.mutate({ endpoint })
            subscription.unsubscribe()
          }
          return
        }

        if (!userInfoQuery.data) return

        if (!subscription) {
          serviceWorkerRegistration.pushManager
            .subscribe({
              userVisibleOnly: true,
              applicationServerKey: settings.WEBPUSH_PUBLIC_KEY,
            })
            .then((subscription) => {
              const subJson = subscription.toJSON()
              if (subJson.endpoint && subJson.keys) {
                addUserSubscriptionMutation.mutate({
                  endpoint: subJson.endpoint,
                  p256dh: subJson.keys.p256dh,
                  auth: subJson.keys.auth,
                })
              }
              console.debug(
                'Push Notifications Subscribed',
                subscription.toJSON(),
              )
            })
            .catch((error) => {
              addNotification({
                type: NotificationType.ERROR,
                message: error.message,
              })
              setWebpushState(false)
            })
        } else {
          console.debug(
            'Push Notifications Already Subscribed',
            subscription.toJSON(),
          )
        }
      })
  }, [
    userInfoQuery.data,
    serviceWorkerRegistration,
    webpushState,
    userInfoQuery.isError,
  ])

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
