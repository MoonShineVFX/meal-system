import type { NotificationSlice } from './notification'
import type { UserSlice } from './user'
import type { MenuSlice } from './menu'

export type StoreState = NotificationSlice & UserSlice & MenuSlice
