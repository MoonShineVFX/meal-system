import { EventEmitter } from 'events'

export const ServerEventName = {
  USER_NOTIFY: (userId: string) => `user-message-${userId}`,
}

/* Global */
declare global {
  var eventEmitter: EventEmitter | undefined
}

export const eventEmitter = global.eventEmitter ?? new EventEmitter()

if (process.env.NODE_ENV !== 'production') {
  global.eventEmitter = eventEmitter
}
