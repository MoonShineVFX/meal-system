import type { NotificationSlice } from './notification'
import type { MenuSlice } from './menu'
import type { RouteSlice } from './route'

export type StoreState = NotificationSlice & MenuSlice & RouteSlice
