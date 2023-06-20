import type { NotificationSlice } from './notification'
import type { UISlice } from './ui'
import type { SettingSlice } from './setting'

export type StoreState = NotificationSlice & UISlice & SettingSlice
