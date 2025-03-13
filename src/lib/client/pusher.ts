import {
  PUSHER_APP_KEY,
  PusherEventPayload,
  PUSHER_WS_HOST,
} from '@/lib/common/pusher'
import Pusher from 'pusher-js'

export const createPusherClient = () => {
  return new Pusher(PUSHER_APP_KEY, {
    wsHost: PUSHER_WS_HOST,
    forceTLS: true,
    authEndpoint: '/api/pusher/auth',
    enabledTransports: ['ws', 'wss'],
    cluster: '',
  })
}

export const subscribeToPusherChannel = (
  pusher: Pusher,
  channelName: string,
  event: string,
  callback: (data: PusherEventPayload) => void,
) => {
  const channel = pusher.subscribe(channelName)
  channel.bind(event, callback)
}
