import { EventEmitter } from 'events'

import { SERVER_NOTIFY, ServerNotifyPayload } from '@/lib/common'
import { getLogger } from './logger'

const log = getLogger('event')

type ServerEventEmitter = Omit<EventEmitter, 'emit'> & {
  emit: (event: string, payload: ServerNotifyPayload) => boolean
}

export const ServerChannelName = {
  PUBLIC_NOTIFY: 'public-message',
  USER_NOTIFY: (userId: string) => `user-message-${userId}`,
  STAFF_NOTIFY: 'staff-message',
}

/**
 * Converts an EventEmitter event to an async iterable
 */
export function onServerEvent<T>(
  emitter: EventEmitter,
  eventName: string,
  options?: { signal?: AbortSignal },
): AsyncIterable<[T]> {
  const items: Array<[T]> = []
  const listeners = {
    resolve: null as null | (() => void),
    reject: null as null | ((err: Error) => void),
  }

  let finished = false

  const cleanup = () => {
    finished = true
    emitter.off(eventName, onItem)
    if (options?.signal) {
      options.signal.removeEventListener('abort', onAbort)
    }
  }

  const onItem = (item: T) => {
    items.push([item])
    listeners.resolve?.()
  }

  const onAbort = () => {
    cleanup()
    listeners.resolve?.()
  }

  if (options?.signal) {
    options.signal.addEventListener('abort', onAbort, { once: true })
  }

  emitter.on(eventName, onItem)

  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          if (items.length > 0) {
            return { value: items.shift()!, done: false }
          }

          if (finished) {
            return { value: undefined, done: true }
          }

          await new Promise<void>((resolve, reject) => {
            listeners.resolve = resolve
            listeners.reject = reject
          })

          return this.next()
        },
        async return() {
          cleanup()
          return { value: undefined, done: true }
        },
      }
    },
  }
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

eventEmitter.setMaxListeners(1024)

// Track connected users
let connectedUsers = 0

export const incrementConnectedUsers = (userId?: string) => {
  connectedUsers++
  log(`Connected users: ${connectedUsers}`)
  if (userId) {
    log(`User ${userId} connected`)
  }

  eventEmitter.emit(ServerChannelName.PUBLIC_NOTIFY, {
    type: SERVER_NOTIFY.SERVER_CONNECTED_USERS_UPDATE,
    skipNotify: true,
  })
}

export const decrementConnectedUsers = (userId?: string) => {
  connectedUsers--
  log(`Connected users: ${connectedUsers}`)
  if (userId) {
    log(`User ${userId} disconnected`)
  }

  eventEmitter.emit(ServerChannelName.PUBLIC_NOTIFY, {
    type: SERVER_NOTIFY.SERVER_CONNECTED_USERS_UPDATE,
    skipNotify: true,
  })
}

export const getConnectedUsers = () => connectedUsers
