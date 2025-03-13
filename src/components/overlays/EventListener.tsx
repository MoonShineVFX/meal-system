import { useEffect, useMemo } from 'react'

import { NotificationType, useStore } from '@/lib/client/store'
import ServiceWorkerHandler from '@/lib/client/sw'
import trpc from '@/lib/client/trpc'
import { SERVER_NOTIFY, getResourceUrl, settings } from '@/lib/common'
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

  /* Server Notification */
  const result = trpc.user.onNotify.useSubscription(undefined, {
    onStarted: () => {
      // Wait for the subscription to be established
      setTimeout(() => {
        utils.user.getConnectedUsers.invalidate()
      }, 100)
    },
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
          utils.menu.get.invalidate()
          utils.cart.get.invalidate()
          break
        case SERVER_NOTIFY.ORDER_ADD:
          utils.menu.get.invalidate()
          utils.cart.get.invalidate()
          utils.user.get.invalidate()
          utils.order.get.invalidate()
          utils.order.getBadgeCount.invalidate()
          utils.transaction.getListByUser.invalidate()
          break
        case SERVER_NOTIFY.ORDER_UPDATE:
          utils.order.get.invalidate()
          utils.order.getBadgeCount.invalidate()
          break
        case SERVER_NOTIFY.ORDER_CANCEL:
          utils.order.get.invalidate()
          utils.user.get.invalidate()
          utils.order.getBadgeCount.invalidate()
          utils.transaction.getListByUser.invalidate()
          break
        case SERVER_NOTIFY.DEPOSIT_RECHARGE:
          utils.user.get.invalidate()
        case SERVER_NOTIFY.USER_TOKEN_UPDATE:
          utils.user.getToken.invalidate()
          break
        case SERVER_NOTIFY.BONUS_APPLY:
          utils.user.get.invalidate()
          break
        case SERVER_NOTIFY.USER_SETTINGS_UPDATE:
          utils.user.get.invalidate()
          break

        // Staff & Admin
        case SERVER_NOTIFY.POS_ADD:
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
        case SERVER_NOTIFY.POS_UPDATE:
          utils.pos.getLive.invalidate()
          utils.pos.getReservation.invalidate()
          utils.order.getList.invalidate()
          break
        case SERVER_NOTIFY.CATEGORY_ADD:
        case SERVER_NOTIFY.CATEGORY_UPDATE:
        case SERVER_NOTIFY.CATEGORY_DELETE:
          utils.category.get.invalidate()
          break
        case SERVER_NOTIFY.COMMODITY_ADD:
        case SERVER_NOTIFY.COMMODITY_UPDATE:
        case SERVER_NOTIFY.COMMODITY_DELETE:
          utils.commodity.getList.invalidate()
          break
        case SERVER_NOTIFY.OPTION_SETS_ADD:
        case SERVER_NOTIFY.OPTION_SETS_UPDATE:
        case SERVER_NOTIFY.OPTION_SETS_DELETE:
          utils.optionSet.get.invalidate()
          break
        case SERVER_NOTIFY.MENU_ADD:
        case SERVER_NOTIFY.MENU_UPDATE:
        case SERVER_NOTIFY.MENU_DELETE:
          utils.menu.get.invalidate()
          utils.menu.getActives.invalidate()
          utils.menu.getReservationsForUser.invalidate()
          break
        case SERVER_NOTIFY.DEPOSIT_UPDATE:
          utils.deposit.getList.invalidate()
          break
        case SERVER_NOTIFY.SUPPLIER_ADD:
        case SERVER_NOTIFY.SUPPLIER_UPDATE:
        case SERVER_NOTIFY.SUPPLIER_DELETE:
          utils.supplier.getList.invalidate()
          utils.commodity.getList.invalidate()
          break
        case SERVER_NOTIFY.USER_AUTHORIY_UPDATE:
          utils.user.get.invalidate()
          utils.user.getStatistics.invalidate()
          break
        case SERVER_NOTIFY.BONUS_ADD:
        case SERVER_NOTIFY.BONUS_UPDATE:
        case SERVER_NOTIFY.BONUS_DELETE:
          utils.bonus.getList.invalidate()
        case SERVER_NOTIFY.SERVER_CONNECTED_USERS_UPDATE:
          utils.user.getConnectedUsers.invalidate()
          break
      }
    },
    onError: (error) => {
      console.error('[EventListener] onNotify error', error)
      addNotification({
        type: NotificationType.ERROR,
        message: `伺服器連線錯誤`,
      })
    },
  })

  const isDisconnected = useMemo(() => {
    return result.status !== 'pending'
  }, [result.status])

  if (!userInfoQuery.isSuccess) {
    return null
  }

  if (isDisconnected) {
    return (
      <div className='fixed inset-x-6 bottom-20 z-50 flex items-center justify-center sm:left-auto sm:right-6 sm:bottom-6'>
        <div className='flex items-center gap-2 rounded-2xl border border-stone-300 bg-white p-3 shadow-lg'>
          <div className='h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-stone-700' />
          <div>
            <p className='text-stone-700'>
              {result.status === 'error' && '連線錯誤'}
              {result.status === 'idle' && '閒置中'}
              {result.status === 'connecting' && '連線中...'}
              {result.status === 'pending' && '等待中...'}
            </p>
            {result.error !== null && (
              <p className='text-sm text-stone-500'>網頁狀態目前不會更新</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
