import { useEffect, useState } from 'react'

import {
  createPusherClient,
  subscribeToPusherChannel,
} from '@/lib/client/pusher'
import { NotificationType, useStore } from '@/lib/client/store'
import ServiceWorkerHandler from '@/lib/client/sw'
import trpc from '@/lib/client/trpc'
import { getResourceUrl, settings } from '@/lib/common'
import {
  PUSHER_CHANNEL,
  PUSHER_EVENT,
  PUSHER_EVENT_NOTIFY,
  PusherEventPayload,
} from '@/lib/common/pusher'
import { twMerge } from 'tailwind-merge'
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
    'connected' | 'connecting' | 'error' | 'disconnected'
  >('disconnected')

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
    if (!userInfoQuery.isSuccess || !userInfoQuery.data) return

    // Get the Pusher client
    const pusher = createPusherClient()

    // Setup error and connection handlers
    pusher.connection.bind('error', (err: any) => {
      console.error('[Pusher] Connection error', err)
      setConnectionStatus('error')
    })

    pusher.connection.bind('connected', () => {
      console.debug('[Pusher] Connected')
      setConnectionStatus('connected')
    })

    pusher.connection.bind('disconnected', () => {
      console.debug('[Pusher] Disconnected')
      setConnectionStatus('disconnected')
    })

    pusher.connection.bind('connecting', () => {
      console.debug('[Pusher] Connecting...')
      setConnectionStatus('connecting')
    })

    // Handle pusher events
    const handleEvent = (eventPayload: PusherEventPayload) => {
      if (!eventPayload.skipNotify) {
        addNotification({
          type: eventPayload.notificationType ?? NotificationType.SUCCESS,
          message: eventPayload.message ?? eventPayload.type,
          link: eventPayload.link,
        })
      }

      switch (eventPayload.type) {
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
        case PUSHER_EVENT.MENU_LIVE_UPDATE:
          utils.menu.get.invalidate({
            type: 'LIVE',
          })
          break

        // Staff & Admin
        case PUSHER_EVENT.POS_ADD:
          utils.pos.getLive.invalidate()
          utils.pos.getReservation.invalidate()
          utils.commodity.getList.invalidate()
          // Check if order is live, 這判斷有點勉強，之後可能需要改
          if (
            eventPayload.link &&
            eventPayload.link.startsWith('/pos/live') &&
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
          break
      }
    }

    // Subscribe to public channel
    subscribeToPusherChannel(
      pusher,
      PUSHER_CHANNEL.PUBLIC,
      PUSHER_EVENT_NOTIFY,
      handleEvent,
    )

    // Subscribe to user-specific channel if user is authenticated
    subscribeToPusherChannel(
      pusher,
      PUSHER_CHANNEL.USER(userInfoQuery.data.id),
      PUSHER_EVENT_NOTIFY,
      handleEvent,
    )

    // Subscribe to staff channel if user is staff
    if (['STAFF', 'ADMIN'].includes(userInfoQuery.data.role)) {
      subscribeToPusherChannel(
        pusher,
        PUSHER_CHANNEL.STAFF,
        PUSHER_EVENT_NOTIFY,
        handleEvent,
      )
    }

    // Cleanup all subscriptions on unmount
    return () => {
      pusher.disconnect()
      pusher.unbind_all()
    }
  }, [userInfoQuery.data?.id, userInfoQuery.data?.role])

  if (!userInfoQuery.isSuccess) {
    return null
  }

  // Show connection status indicator when not connected
  if (connectionStatus !== 'connected') {
    return (
      <div className='fixed inset-x-6 bottom-20 z-50 flex items-center justify-center sm:left-auto sm:right-6 sm:bottom-6'>
        <div className='flex items-center gap-2 rounded-2xl border border-stone-300 bg-white px-4 py-3 shadow-lg'>
          <div
            className={twMerge(
              'mx-1 h-4 w-4 rounded-full border-t-2 border-b-2 border-stone-700',
              connectionStatus === 'connecting' && 'animate-spin',
            )}
          />
          <div>
            <p className='text-stone-700'>
              {(connectionStatus === 'error' ||
                connectionStatus === 'disconnected') &&
                '頻道連線錯誤'}
              {connectionStatus === 'connecting' && '連線中...'}
            </p>
            {(connectionStatus === 'error' ||
              connectionStatus === 'disconnected') && (
              <p className='text-sm text-stone-500'>網頁狀態目前不會更新</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
