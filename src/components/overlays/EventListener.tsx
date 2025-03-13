import { useEffect, useState } from 'react'

import {
  PusherUnsubscribeFunction,
  getPusherClient,
  subscribeToPusherChannel,
} from '@/lib/client/pusher'
import { NotificationType, useStore } from '@/lib/client/store'
import ServiceWorkerHandler from '@/lib/client/sw'
import trpc from '@/lib/client/trpc'
import { getResourceUrl, settings } from '@/lib/common'
import {
  PUSHER_EVENT,
  PUSHER_CHANNEL,
  PUSHER_EVENT_NOTIFY,
} from '@/lib/common/pusher'
import { WithAuth } from './AuthValidator'

export default function EventListener() {
  return (
    <WithAuth>
      <EventListenerBase />
    </WithAuth>
  )
}

export function EventListenerBase() {
  const utils = trpc.useUtils()
  const {
    addNotification,
    posNotificationSound,
    serviceWorkerHandler,
    setServiceWorkerHandler,
  } = useStore((state) => ({
    addNotification: state.addNotification,
    posNotificationSound: state.posNotificationSound_local,
    serviceWorkerHandler: state.serviceWorkerHandler,
    setServiceWorkerHandler: state.setServiceWorkerHandler,
  }))
  const userInfoQuery = trpc.user.get.useQuery(undefined)
  const userSub = trpc.user.getToken.useQuery(undefined)
  const addUserSubscriptionMutation = trpc.user.updateToken.useMutation()
  const deleteUserSubscriptionMutation =
    trpc.user.deleteSubscription.useMutation()

  // Connection status state
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'error'
  >('connecting')

  /* Pusher Push Notifications Initialize */
  useEffect(() => {
    if (!serviceWorkerHandler) {
      setServiceWorkerHandler(
        new ServiceWorkerHandler({
          onSubscriptionChange: (subscription, state, endpoint) => {
            if (state === 'subscribe') {
              if (!subscription) return
              const subJson = subscription.toJSON()
              if (subJson.endpoint && subJson.keys) {
                addUserSubscriptionMutation.mutate({
                  endpoint: subJson.endpoint,
                  p256dh: subJson.keys.p256dh,
                  auth: subJson.keys.auth,
                })
              }
              console.debug('Push Notifications Subscribed')
            } else if (state === 'unsubscribe') {
              if (!subscription && !endpoint) return
              const thisEndpoint = endpoint || subscription?.endpoint
              if (!thisEndpoint) return
              deleteUserSubscriptionMutation.mutate({
                endpoint: thisEndpoint,
              })
            } else {
              console.warn('Unknown Push Notifications State')
            }
          },
          onError: (error) => {
            if (error.message.includes('push service error')) {
              addNotification({
                type: NotificationType.ERROR,
                message: '無法訂閱通知服務，將關閉通知設定',
              })
              return
            }
            addNotification({
              type: NotificationType.ERROR,
              message: error.message,
            })
          },
        }),
      )
    } else {
      if (userSub.isError) {
        serviceWorkerHandler.setUser(null)
      }
      if (userSub.data) {
        serviceWorkerHandler.setUser(userSub.data)
      }
    }
  }, [userSub.data, serviceWorkerHandler, userSub.isError])

  /* Pusher Event Subscription */
  useEffect(() => {
    // Don't subscribe until user info is loaded
    if (!userInfoQuery.isSuccess) {
      return
    }

    // Get the Pusher client
    const pusher = getPusherClient()
    const unsubscribeFunctions: PusherUnsubscribeFunction[] = []

    // Setup error and connection handlers
    pusher.connection.bind('error', (err: any) => {
      console.error('[Pusher] Connection error', err)
      setConnectionStatus('error')
      addNotification({
        type: NotificationType.ERROR,
        message: `伺服器連線錯誤`,
      })
    })

    pusher.connection.bind('connected', () => {
      setConnectionStatus('connected')
      // When connected, invalidate connected users count
      utils.user.getConnectedUsers.invalidate()
    })

    pusher.connection.bind('disconnected', () => {
      setConnectionStatus('connecting')
    })

    pusher.connection.bind('connecting', () => {
      setConnectionStatus('connecting')
    })

    // Handle notification events
    const handleNotify = (notifyPayload: any) => {
      if (!notifyPayload.skipNotify) {
        addNotification({
          type: notifyPayload.notificationType ?? NotificationType.SUCCESS,
          message: notifyPayload.message ?? notifyPayload.type,
          link: notifyPayload.link,
        })
      }

      switch (notifyPayload.type) {
        // User
        case PUSHER_EVENT.CART_ADD:
        case PUSHER_EVENT.CART_DELETE:
        case PUSHER_EVENT.CART_UPDATE:
          utils.menu.get.invalidate()
          utils.cart.get.invalidate()
          break
        case PUSHER_EVENT.ORDER_ADD:
          utils.menu.get.invalidate()
          utils.cart.get.invalidate()
          utils.user.get.invalidate()
          utils.order.get.invalidate()
          utils.order.getBadgeCount.invalidate()
          utils.transaction.getListByUser.invalidate()
          break
        case PUSHER_EVENT.ORDER_UPDATE:
          utils.order.get.invalidate()
          utils.order.getBadgeCount.invalidate()
          break
        case PUSHER_EVENT.ORDER_CANCEL:
          utils.order.get.invalidate()
          utils.user.get.invalidate()
          utils.order.getBadgeCount.invalidate()
          utils.transaction.getListByUser.invalidate()
          break
        case PUSHER_EVENT.DEPOSIT_RECHARGE:
          utils.user.get.invalidate()
        case PUSHER_EVENT.USER_TOKEN_UPDATE:
          utils.user.getToken.invalidate()
          break
        case PUSHER_EVENT.BONUS_APPLY:
          utils.user.get.invalidate()
          break
        case PUSHER_EVENT.USER_SETTINGS_UPDATE:
          utils.user.get.invalidate()
          break

        // Staff & Admin
        case PUSHER_EVENT.POS_ADD:
          utils.pos.getLive.invalidate()
          utils.pos.getReservation.invalidate()
          utils.commodity.getList.invalidate()
          // Check if order is live, 這判斷有點勉強，之後可能需要改
          if (
            notifyPayload.link &&
            notifyPayload.link.startsWith('/pos/live') &&
            posNotificationSound
          ) {
            const audio = new Audio(
              `${getResourceUrl()}/${settings.RESOURCE_NOTIFICATION_SOUND}`,
            )
            audio.play()
          }
          break
        case PUSHER_EVENT.POS_UPDATE:
          utils.pos.getLive.invalidate()
          utils.pos.getReservation.invalidate()
          utils.order.getList.invalidate()
          break
        case PUSHER_EVENT.CATEGORY_ADD:
        case PUSHER_EVENT.CATEGORY_UPDATE:
        case PUSHER_EVENT.CATEGORY_DELETE:
          utils.category.get.invalidate()
          break
        case PUSHER_EVENT.COMMODITY_ADD:
        case PUSHER_EVENT.COMMODITY_UPDATE:
        case PUSHER_EVENT.COMMODITY_DELETE:
          utils.commodity.getList.invalidate()
          break
        case PUSHER_EVENT.OPTION_SETS_ADD:
        case PUSHER_EVENT.OPTION_SETS_UPDATE:
        case PUSHER_EVENT.OPTION_SETS_DELETE:
          utils.optionSet.get.invalidate()
          break
        case PUSHER_EVENT.MENU_ADD:
        case PUSHER_EVENT.MENU_UPDATE:
        case PUSHER_EVENT.MENU_DELETE:
          utils.menu.get.invalidate()
          utils.menu.getActives.invalidate()
          utils.menu.getReservationsForUser.invalidate()
          break
        case PUSHER_EVENT.DEPOSIT_UPDATE:
          utils.deposit.getList.invalidate()
          break
        case PUSHER_EVENT.SUPPLIER_ADD:
        case PUSHER_EVENT.SUPPLIER_UPDATE:
        case PUSHER_EVENT.SUPPLIER_DELETE:
          utils.supplier.getList.invalidate()
          utils.commodity.getList.invalidate()
          break
        case PUSHER_EVENT.USER_AUTHORIY_UPDATE:
          utils.user.get.invalidate()
          utils.user.getStatistics.invalidate()
          break
        case PUSHER_EVENT.BONUS_ADD:
        case PUSHER_EVENT.BONUS_UPDATE:
        case PUSHER_EVENT.BONUS_DELETE:
          utils.bonus.getList.invalidate()
        case PUSHER_EVENT.SERVER_CONNECTED_USERS_UPDATE:
          utils.user.getConnectedUsers.invalidate()
          break
      }
    }

    // Subscribe to public channel
    const publicUnsubscribe = subscribeToPusherChannel(
      PUSHER_CHANNEL.PUBLIC,
      PUSHER_EVENT_NOTIFY,
      handleNotify,
    )
    unsubscribeFunctions.push(publicUnsubscribe)

    // Subscribe to user-specific channel if user is authenticated
    if (userInfoQuery.data && userInfoQuery.data.id) {
      const userUnsubscribe = subscribeToPusherChannel(
        PUSHER_CHANNEL.USER(userInfoQuery.data.id),
        PUSHER_EVENT_NOTIFY,
        handleNotify,
      )
      unsubscribeFunctions.push(userUnsubscribe)
    }

    // Subscribe to staff channel if user is staff
    if (
      userInfoQuery.data &&
      ['STAFF', 'ADMIN'].includes(userInfoQuery.data.role)
    ) {
      const staffUnsubscribe = subscribeToPusherChannel(
        PUSHER_CHANNEL.STAFF,
        PUSHER_EVENT_NOTIFY,
        handleNotify,
      )
      unsubscribeFunctions.push(staffUnsubscribe)
    }

    // Cleanup all subscriptions on unmount
    return () => {
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe())
    }
  }, [userInfoQuery.isSuccess, userInfoQuery.data])

  if (!userInfoQuery.isSuccess) {
    return null
  }

  // Show connection status indicator when not connected
  if (connectionStatus !== 'connected') {
    return (
      <div className='fixed inset-x-6 bottom-20 z-50 flex items-center justify-center sm:left-auto sm:right-6 sm:bottom-6'>
        <div className='flex items-center gap-2 rounded-2xl border border-stone-300 bg-white p-3 shadow-lg'>
          <div className='h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-stone-700' />
          <div>
            <p className='text-stone-700'>
              {connectionStatus === 'error' && '連線錯誤'}
              {connectionStatus === 'connecting' && '連線中...'}
            </p>
            {connectionStatus === 'error' && (
              <p className='text-sm text-stone-500'>網頁狀態目前不會更新</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
