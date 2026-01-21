import {
  PUSHER_APP_KEY,
  PUSHER_EVENT_NOTIFY,
  PUSHER_WS_HOST,
  PusherChannel,
  PusherEventPayload,
  PusherWebhookEvent,
} from '@/lib/common/pusher'
import Pusher from 'pusher'
import { getDebugLogger } from './logger'

const log = getDebugLogger('pusher')

// Pusher configuration
let pusherInstance: Pusher | null = null
const WEBHOOK_CHANNEL = 'webhook' as const

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

export const emitPusherWebhook = async (
  event: PusherWebhookEvent,
  message: any,
) => {
  try {
    const pusher = getPusherServer()
    await pusher.trigger(WEBHOOK_CHANNEL, event, message)
    log(`Triggered webhook with event ${event}`)
    return true
  } catch (error) {
    log(`Error triggering Pusher webhook: ${error}`)
    return false
  }
}

export default getPusherServer
