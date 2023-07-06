import { StateCreator } from 'zustand'

import { settings } from '@/lib/common'
import type { StoreState } from './define'

export enum NotificationType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  INFO = 'INFO',
}

export type NotificationPayload = {
  type: NotificationType
  message: string
  id: number
  removeTimeout: NodeJS.Timeout
  link?: string
  tag?: string
}

export interface NotificationSlice {
  notifications: NotificationPayload[]
  notificationIdCounter: number
  addNotification: (
    payload: Omit<NotificationPayload, 'id' | 'removeTimeout'>,
  ) => void
  removeNotification: (id: number) => void
}

export const createNotificationSlice: StateCreator<
  StoreState,
  [],
  [],
  NotificationSlice
> = (set, get) => ({
  notifications: [],
  notificationIdCounter: 0,
  addNotification: async (payload) => {
    set((state) => {
      const id = state.notificationIdCounter
      const timeOut = setTimeout(
        () => get().removeNotification(id),
        settings.NOTIFICATION_DURATION_MS,
      )
      return {
        notifications: [
          { ...payload, id, removeTimeout: timeOut },
          ...state.notifications.filter((n) => {
            if (n.tag && payload.tag) {
              return n.tag !== payload.tag
            }
            return true
          }),
        ],
        notificationIdCounter: state.notificationIdCounter + 1,
      }
    })
  },
  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)

      if (!notification) return {}

      if (notification.removeTimeout) {
        clearTimeout(notification.removeTimeout)
      }
      return {
        notifications: state.notifications.filter((n) => n !== notification),
      }
    })
  },
})
