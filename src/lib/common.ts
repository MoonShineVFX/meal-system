import { TransactionType, UserRole, Menu, MenuType } from '@prisma/client'

import type { NotificationType } from '@/lib/client/store'

/* Types */
export type ConvertPrismaJson<T extends object> = {
  [key in keyof T]: key extends 'optionSets'
    ? OptionSet[]
    : key extends 'options'
    ? OrderOptions
    : T[key] extends Date
    ? Date
    : T[key] extends object
    ? ConvertPrismaJson<T[key]>
    : T[key]
}

export type ServerNotifyPayload = {
  type: SERVER_NOTIFY
  message?: string
  skipNotify?: boolean
  link?: string
  notificationType?: NotificationType
}

export enum SERVER_NOTIFY {
  CART_ADD = '加入餐點至購物車',
  CART_DELETE = '移除購物車餐點',
  CART_UPDATE = '修改購物車餐點',
  ORDER_ADD = '結帳完成',
  ORDER_UPDATE = '訂單狀態更新',
  ORDER_CANCEL = '訂單取消',
  DAILY_RECHARGE = '今日點數已發放',
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
  DEPOSIT_RECHARGE = '儲值成功',
  DEPOSIT_REFUND = '退款成功',
  DEPOSIT_FAILED = '儲值失敗',
}

export enum CurrencyType {
  CREDIT = 'credit',
  POINT = 'point',
}

export type OptionSet = {
  name: string
  multiSelect: boolean
  order: number
  options: string[]
}

export type OrderOptions = Record<string, string | string[]>
export const ORDER_STATUS = [
  'timeCanceled',
  'timeCompleted',
  'timeDishedUp',
  'timePreparing',
] as const
export type OrderStatus = typeof ORDER_STATUS[number]

export enum MenuUnavailableReason {
  NOT_PUBLISHED = '尚未到達開放訂購時間',
  CLOSED = '已過開放訂購時間',
  MENU_LIMIT_PER_USER_EXCEEDED = '您已達全部餐點的訂購上限',
}

export enum ComUnavailableReason {
  STOCK_OUT = '餐點已售完',
  COM_LIMIT_PER_USER_EXCEEDED = '您已達此餐點的每人訂購數量上限',
  COM_LIMIT_PER_ORDER_EXCEEDED = '您已達此餐點的單筆訂購數量上限',
}

export const MenuTypeName: Record<MenuType, string> = {
  [MenuType.BREAKFAST]: '早餐',
  [MenuType.LUNCH]: '午餐',
  [MenuType.DINNER]: '晚餐',
  [MenuType.TEA]: '下午茶',
  [MenuType.LIVE]: '即時',
  [MenuType.RETAIL]: '自助',
}

export const TransactionName: Record<TransactionType, string> = {
  [TransactionType.PAYMENT]: '付款',
  [TransactionType.REFUND]: '退款',
  [TransactionType.RECHARGE]: '獎勵',
  [TransactionType.CANCELED]: '取消訂單',
  [TransactionType.TRANSFER]: '轉帳',
  [TransactionType.DEPOSIT]: '儲值',
}

/* Settings */
export const settings = {
  /* Auth */
  AUTH_API_URL: process.env.AUTH_API_URL!,
  COOKIE_TOKEN_NAME: 'meal_token',
  COOKIE_EXPIRE_DAYS: 14,

  /* Server */
  MENU_MAX_QUANTITY_PER_ORDER: 10,
  TOKEN_COUNT_PER_USER: 10,
  SERVER_USER_ID: '_server',
  POINT_DAILY_RECHARGE_AMOUNT: process.env.POINT_DAILY_RECHARGE_AMOUNT
    ? parseInt(process.env.POINT_DAILY_RECHARGE_AMOUNT)
    : 100,
  DEPOSIT_RATIO: process.env.DEPOSIT_RATIO
    ? parseFloat(process.env.DEPOSIT_RATIO)
    : 1.0,
  DEPOSIT_MIN_AMOUNT: 30,
  DEPOSIT_MAX_AMOUNT: 10000,
  QRCODE_KEY: process.env.QRCODE_KEY!,

  /* NewebPay */
  NEWEBPAY_API_URL: process.env.NEWEBPAY_API_URL!,
  NEWEBPAY_MERCHANT_ID: process.env.NEWEBPAY_MERCHANT_ID!,
  NEWEBPAY_HASH_KEY: process.env.NEWEBPAY_HASH_KEY!,
  NEWEBPAY_HASH_IV: process.env.NEWEBPAY_HASH_IV!,
  NEWEBPAY_NOTIFY_URL: process.env.NEWEBPAY_NOTIFY_URL!,
  NEWEBPAY_RETURN_URL: process.env.NEWEBPAY_RETURN_URL!,

  /* Server */
  WEBSOCKET_DEV_PORT: process.env.NEXT_PUBLIC_WEBSOCKET_DEV_PORT ?? '3001',
  WEBSOCKET_PROD_HOST: process.env.NEXT_PUBLIC_WEBSOCKET_PROD_HOST,
  HTTP_PORT: process.env.PORT ?? '3000',

  /* Blockchain */
  BLOCKCHAIN_URL: process.env.BLOCKCHAIN_URL!,
  BLOCKCHAIN_CREDIT_ADDRESS: process.env.BLOCKCHAIN_CREDIT_ADDRESS!,
  BLOCKCHAIN_POINT_ADDRESS: process.env.BLOCKCHAIN_POINT_ADDRESS!,
  BLOCKCHAIN_PRIVATE_KEY: process.env.BLOCKCHAIN_PRIVATE_KEY!,
  BLOCKCHAIN_GAS_PRICE: 5,
  BLOCKCHAIN_GAS: 200000,
  BLOCKCHAIN_NONCE_MS: 1000 * 60,

  /* Log */
  LOG_BLOCKCHAIN: process.env.LOG_BLOCKCHAIN === 'true',
  LOG_DATABASE: process.env.LOG_DATABASE === 'true',

  /* Resource */
  RESOURCE_URL: process.env.NEXT_PUBLIC_RESOURCE_URL ?? '',
  RESOURCE_FOOD_PLACEHOLDER: 'asset/food-placeholder.png',
  RESOURCE_PROFILE_PLACEHOLDER: 'asset/profile-placeholder.png',
  RESOURCE_LOGIN_COVER: 'asset/login-cover.jpg',
  RESOURCE_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
  RESOURCE_UPLOAD_PATH: 'upload',

  /* Bunny */
  BUNNY_API_KEY: process.env.BUNNY_API_KEY!,
  BUNNY_UPLOAD_URL: process.env.BUNNY_UPLOAD_URL!,

  /* UI */
  ORDER_TAKE_PER_QUERY: 20,
  TRANSACTIONS_PER_QUERY: 20,
  NOTIFICATION_DURATION_MS: 3500,
  MENU_CATEGORY_NULL: '未分類',
  TITLE: '夢想餐飲',
}

/* Functions */
export function generateCookie(token: string | undefined) {
  const expireTime = token ? settings.COOKIE_EXPIRE_DAYS * 24 * 60 * 60 : 0
  return `${settings.COOKIE_TOKEN_NAME}=${token}; Max-Age=${expireTime}; Path=/; SameSite=Strict`
}

export function generateOptionsKey(options: OrderOptions) {
  return Object.entries(options)
    .sort()
    .reduce((acc, cur) => {
      const prefix = acc === '' ? '' : '_'
      const value = Array.isArray(cur[1]) ? cur[1].sort().join(',') : cur[1]
      return `${acc}${prefix}${cur[0]}:${value}`
    }, '')
}

export function validateRole(sourceRole: UserRole, targetRole: UserRole) {
  const roleWeight = {
    [UserRole.ADMIN]: 100,
    [UserRole.STAFF]: 50,
    [UserRole.USER]: 10,
  }

  return roleWeight[sourceRole] >= roleWeight[targetRole]
}

type TwDataKeys = 'selected' | 'loading' | 'busy' | 'available'
export function twData(
  parms: Partial<Record<TwDataKeys, boolean | undefined>>,
) {
  return {
    'data-ui': Object.entries(parms)
      .map(([key, value]) => (value ? key : `not-${key}`))
      .join(' '),
  }
}

export function getMenuName(menu?: Pick<Menu, 'date' | 'name' | 'type'>) {
  if (menu === undefined) return undefined

  if (menu.type === 'LIVE') return '即時點餐'
  if (menu.type === 'RETAIL') return '自助'
  if (menu.date === null) return '錯誤菜單'
  const typeName = MenuTypeName[menu.type]

  return `${menu.date.toLocaleDateString('zh-TW', {
    month: 'long',
    day: 'numeric',
  })} ${typeName}${menu.name !== '' ? ` - ${menu.name}` : ''}`
}
