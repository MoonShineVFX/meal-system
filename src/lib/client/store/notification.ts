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
}

export interface NotificationSlice {
  notifications: NotificationPayload[]
  notificationIdCounter: number
  addNotification: (payload: Omit<NotificationPayload, 'id'>) => void
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
      setTimeout(
        () => get().removeNotification(id),
        settings.NOTIFICATION_DURATION,
      )
      return {
        notifications: [...state.notifications, { ...payload, id }],
        notificationIdCounter: state.notificationIdCounter + 1,
      }
    })
  },
  removeNotification: (id) => {
    set((state) => {
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
      }
    })
  },
})
