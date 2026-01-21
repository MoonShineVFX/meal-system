// Shared Pusher constants between client and server
import type { NotificationType } from '@/lib/client/store'

// Pusher event name for all notifications
export const PUSHER_EVENT_NOTIFY = 'notify'

// Environment variables
export const PUSHER_APP_KEY = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || ''
export const PUSHER_WS_HOST = process.env.NEXT_PUBLIC_PUSHER_WS_HOST || ''

// Channel names
export const PUSHER_CHANNEL_USER_PREFIX = 'private-user-message-' as const
export const PUSHER_CHANNEL_STAFF = 'private-staff-message' as const
export const PUSHER_CHANNEL_PUBLIC = 'public-message' as const
export type PusherChannel =
  | `${typeof PUSHER_CHANNEL_USER_PREFIX}${string}`
  | typeof PUSHER_CHANNEL_STAFF
  | typeof PUSHER_CHANNEL_PUBLIC

export const PUSHER_CHANNEL = {
  PUBLIC: 'public-message',
  USER: (userId: string) => `${PUSHER_CHANNEL_USER_PREFIX}${userId}` as const,
  STAFF: PUSHER_CHANNEL_STAFF,
} as const

// Pusher event types
export type PusherEventPayload = {
  type: PUSHER_EVENT
  message?: string
  skipNotify?: boolean
  link?: string
  notificationType?: NotificationType
}

export enum PUSHER_EVENT {
  ORDER_UPDATE = '訂單狀態更新',
  ORDER_CANCEL = '訂單取消',
  BONUS_REDEEMED = '已取得贈送點數',
  POS_ADD = '待處理點餐新增',
  POS_UPDATE = '待處理點餐更新',
  CATEGORY_ADD = '分類新增',
  CATEGORY_UPDATE = '分類更新',
  CATEGORY_DELETE = '分類刪除',
  OPTION_SETS_ADD = '選項新增',
  OPTION_SETS_UPDATE = '選項更新',
  OPTION_SETS_DELETE = '選項刪除',
  COMMODITY_ADD = '餐點已新增',
  COMMODITY_UPDATE = '餐點編輯成功',
  COMMODITY_DELETE = '餐點已刪除',
  MENU_ADD = '菜單已新增',
  MENU_UPDATE = '菜單編輯成功',
  MENU_DELETE = '菜單已刪除',
  MENU_LIVE_UPDATE = '即時點餐已更動',
  MENU_RESERVATION_UPDATE = '預約點餐已更動',
  DEPOSIT_RECHARGE = '儲值成功',
  DEPOSIT_REFUND = '退款成功',
  DEPOSIT_FAILED = '儲值失敗',
  DEPOSIT_UPDATE = '儲值狀態更新',
  SUPPLIER_ADD = '店家新增',
  SUPPLIER_UPDATE = '店家更新',
  SUPPLIER_DELETE = '店家刪除',
  BONUS_ADD = '獎勵新增',
  BONUS_UPDATE = '獎勵更新',
  BONUS_DELETE = '獎勵刪除',
  BONUS_APPLY = '獎勵已發放',
  USER_TEST_PUSH_NOTIFICATION = '測試推送通知',
  USER_TOKEN_UPDATE = '用戶裝置設定已更改',
  USER_AUTHORIY_UPDATE = '用戶權限已更改',
}

// Webhook event types
export const PUSHER_WEBHOOK_EVENT = ['ORDER_ADD'] as const
export type PusherWebhookEvent = typeof PUSHER_WEBHOOK_EVENT[number]
