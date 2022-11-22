import create from 'zustand'

import { createNotificationSlice } from './notification'
import { createUserSlice } from './user'
import { createTransactionSlice } from './transaction'
import type { StoreState } from './define'

export const useStore = create<StoreState>()((...a) => ({
  ...createNotificationSlice(...a),
  ...createUserSlice(...a),
  ...createTransactionSlice(...a),
}))

export { NotificationType } from './notification'
export type { NotificationPayload } from './notification'
