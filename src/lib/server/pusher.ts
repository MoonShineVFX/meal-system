import {
  PUSHER_APP_KEY,
  PUSHER_EVENT_NOTIFY,
  PUSHER_WS_HOST,
  PusherChannel,
  PusherEventPayload,
} from '@/lib/common/pusher'
import Pusher from 'pusher'
import { getDebugLogger } from './logger'

const log = getDebugLogger('pusher')

// Pusher configuration
let pusherInstance: Pusher | null = null

export const getPusherServer = () => {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      host: PUSHER_WS_HOST,
      port: '443',
      appId: `${PUSHER_APP_KEY}-id`,
      key: PUSHER_APP_KEY,
      secret: process.env.PUSHER_SECRET || '',
      useTLS: true,
      cluster: '',
    })
  }
  return pusherInstance
}

// Direct method to send events through Pusher
export const emitPusherEvent = async (
  channel: PusherChannel,
  payload: PusherEventPayload,
) => {
  try {
    const pusher = getPusherServer()
    await pusher.trigger(channel, PUSHER_EVENT_NOTIFY, payload)
    log(`Triggered event on channel ${channel}: ${payload.type}`)
    return true
  } catch (error) {
    log(`Error triggering Pusher event: ${error}`)
    return false
  }
}

export default getPusherServer
