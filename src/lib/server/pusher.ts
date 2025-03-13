import {
  PUSHER_CHANNEL,
  PUSHER_EVENT,
  PUSHER_EVENT_NOTIFY,
  PusherChannel,
  PusherEventPayload,
} from '@/lib/common/pusher'
import Pusher from 'pusher'
import { getLogger } from './logger'

const log = getLogger('pusher')

// Pusher configuration
const pusherConfig = {
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
  useTLS: true,
}

let pusherInstance: Pusher | null = null

export const getPusherServer = () => {
  if (!pusherInstance) {
    pusherInstance = new Pusher(pusherConfig)
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

// Track connected users (migrated from event.ts)
let connectedUsers = 0

export const incrementConnectedUsers = (userId?: string) => {
  connectedUsers++
  log(`Connected users: ${connectedUsers}`)
  if (userId) {
    log(`User ${userId} connected`)
  }

  // Use direct Pusher method
  emitPusherEvent(PUSHER_CHANNEL.PUBLIC, {
    type: PUSHER_EVENT.SERVER_CONNECTED_USERS_UPDATE,
    skipNotify: true,
  })
}

export const decrementConnectedUsers = (userId?: string) => {
  connectedUsers--
  log(`Connected users: ${connectedUsers}`)
  if (userId) {
    log(`User ${userId} disconnected`)
  }

  // Use direct Pusher method
  emitPusherEvent(PUSHER_CHANNEL.PUBLIC, {
    type: PUSHER_EVENT.SERVER_CONNECTED_USERS_UPDATE,
    skipNotify: true,
  })
}

export const getConnectedUsers = () => connectedUsers

export default getPusherServer
