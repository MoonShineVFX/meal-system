import { EventEmitter } from 'events'

export const Event = {
  USER_UPDATE: (userId: string) => `user-update-${userId}`,
  TRANSACTION_ADD_USER: (userId: string) => `transaction-add-${userId}`,
  TRANSACTION_ADD_STAFF: 'transaction-add-staff',
  TRANSACTION_ADD_ADMIN: 'transaction-add-admin',
}

/* Global */
declare global {
  var eventEmitter: EventEmitter | undefined
}

export const eventEmitter = global.eventEmitter ?? new EventEmitter()

if (process.env.NODE_ENV !== 'production') {
  global.eventEmitter = eventEmitter
}
