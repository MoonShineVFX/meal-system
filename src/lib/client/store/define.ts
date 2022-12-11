import type { NotificationSlice } from './notification'
import type { UserSlice } from './user'
import type { TransactionSlice } from './transaction'
import type { MenuSlice } from './menu'

export type StoreState = NotificationSlice &
  UserSlice &
  TransactionSlice &
  MenuSlice
