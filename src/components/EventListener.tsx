import { Role } from '@prisma/client'
import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import Pusher from 'pusher-js'

import { addNotificationAtom, NotificationType } from './Notification'
import trpc from '@/lib/client/trpc'
import { settings, Event } from '@/lib/common'

Pusher.logToConsole = process.env.NODE_ENV !== 'production'

export default function EventListener() {
  const trpcContext = trpc.useContext()
  const [, addNotification] = useAtom(addNotificationAtom)
  const pusher = useRef<Pusher | null>(null)
  const userInfoQuery = trpc.user.info.useQuery(undefined)

  useEffect(() => {
    if (userInfoQuery.data && !pusher.current) {
      // Create pusher
      pusher.current = new Pusher(settings.PUSHER_KEY, {
        wsHost: settings.PUSHER_HOST,
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        userAuthentication: {
          endpoint: '/api/pusher/user-auth',
          transport: 'ajax',
        },
      })
      // Subscribe to pusher channel
      pusher.current.user.bind(Event.USER_TRANSACTION, (data: any) => {
        // revalidate userinfo
        trpcContext.user.info.invalidate()
        // update transcations
        trpcContext.trade.listTransactions.invalidate({ role: Role.USER })
      })
      pusher.current.signin()
    }
  }, [userInfoQuery.data])

  return null
}
