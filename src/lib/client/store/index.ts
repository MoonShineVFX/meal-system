import create from 'zustand'

import { createNotificationSlice } from './notification'
import { createMenuSlice } from './menu'
import { createRouteSlice } from './route'
import type { StoreState } from './define'

export const useStore = create<StoreState>()((...a) => ({
  ...createNotificationSlice(...a),
  ...createMenuSlice(...a),
  ...createRouteSlice(...a),
}))

export { NotificationType } from './notification'
export type { NotificationPayload } from './notification'
