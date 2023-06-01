import type { NotificationSlice } from './notification'
import type { MenuSlice } from './menu'
import type { RouteSlice } from './route'
import type { UISlice } from './ui'

export type StoreState = NotificationSlice & MenuSlice & RouteSlice & UISlice
