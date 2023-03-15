import { EventEmitter } from 'events'

import { ServerNotifyPayload } from '@/lib/common'

type ServerEventEmitter = Omit<EventEmitter, 'emit'> & {
  emit: (event: string, payload: ServerNotifyPayload) => boolean
}

export const ServerChannelName = {
  PUBLIC_NOTIFY: 'public-message',
  USER_NOTIFY: (userId: string) => `user-message-${userId}`,
  STAFF_NOTIFY: 'staff-message',
}

/* Global */
declare global {
  var eventEmitter: ServerEventEmitter | undefined
}

export const eventEmitter: ServerEventEmitter =
  global.eventEmitter ?? new EventEmitter()

if (process.env.NODE_ENV !== 'production') {
  global.eventEmitter = eventEmitter
}
