import { PusherEventPayload } from '@/lib/common/pusher'
import Pusher from 'pusher-js'

// Pusher configuration
const PUSHER_APP_KEY = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || ''
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1'

let pusherInstance: Pusher | null = null

export const getPusherClient = () => {
  if (!pusherInstance) {
    pusherInstance = new Pusher(PUSHER_APP_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
      // Add auth endpoint for private channels
      authEndpoint: '/api/pusher/auth',
    })
  }
  return pusherInstance
}

export const subscribeToPusherChannel = (
  channelName: string,
  event: string,
  callback: (data: PusherEventPayload) => void,
) => {
  const pusher = getPusherClient()
  const channel = pusher.subscribe(channelName)
  channel.bind(event, callback)

  return () => {
    channel.unbind(event, callback)
    pusher.unsubscribe(channelName)
  }
}

export type PusherUnsubscribeFunction = ReturnType<
  typeof subscribeToPusherChannel
>

export default getPusherClient
