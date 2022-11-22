import type { NotificationSlice } from './notification'
import type { UserSlice } from './user'
import type { TransactionSlice } from './transaction'

export type StoreState = NotificationSlice & UserSlice & TransactionSlice
