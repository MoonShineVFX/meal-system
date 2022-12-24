import { TransactionType, UserRole, Menu } from '@prisma/client'

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
}

export enum SERVER_NOTIFY {
  CART_ADD = '加入餐點至購物車',
  CART_DELETE = '移除購物車餐點',
  CART_UPDATE = '修改購物車餐點',
  ORDER_ADD = '結帳完成',
  ORDER_UPDATE = '訂單狀態更新',
  POS_ADD = '',
  POS_UPDATE = '',
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

/* Settings */
export const settings = {
  /* Auth */
  AUTH_API_URL: process.env.AUTH_API_URL!,
  COOKIE_TOKEN_NAME: 'meal_token',
  COOKIE_EXPIRE_DAYS: 14,
  /* Events */
  NOTIFICATION_DURATION_MS: 3500,
  /* Database */
  TOKEN_COUNT_PER_USER: 10,
  SERVER_USER_ID: '_server',
  TRANSACTION_NAME: {
    [TransactionType.RECHARGE]: '儲值',
    [TransactionType.PAYMENT]: '消費',
    [TransactionType.REFUND]: '退款',
    [TransactionType.TRANSFER]: '轉帳',
  },
  /* Trade */
  TRANSACTIONS_PER_PAGE: 20,
  /* TWMP */
  TWMP_API_URL: process.env.TWMP_API_URL!,
  TWMP_ACQ_BANK: process.env.TWMP_ACQ_BANK!,
  TWMP_MERCHANT_ID: process.env.TWMP_MERCHANT_ID!,
  TWMP_TERMINAL_ID: process.env.TWMP_TERMINAL_ID!,
  TWMP_3DES_IV: process.env.TWMP_3DES_IV!,
  TWMP_3DES_KEY: process.env.TWMP_3DES_KEY!,
  TWMP_FISC_KEY: process.env.TWMP_FISC_KEY!,
  /* Server */
  WEBSOCKET_DEV_PORT: process.env.NEXT_PUBLIC_WEBSOCKET_DEV_PORT ?? '3001',
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
  /* Menu */
  MENU_CATEGORY_NULL: '未分類',
  MENU_MAX_QUANTITY_PER_ORDER: 10,
  /* Misc */
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

export function getMenuName(menu: Pick<Menu, 'date' | 'name' | 'type'>) {
  if (menu.type === 'MAIN') return '即時點餐'
  if (menu.date === null) return '錯誤菜單'
  let typeName: string
  switch (menu.type) {
    case 'BREAKFAST':
      typeName = '早餐'
      break
    case 'LUNCH':
      typeName = '午餐'
      break
    case 'DINNER':
      typeName = '晚餐'
      break
    case 'TEA':
      typeName = '下午茶'
      break
    default:
      typeName = '錯誤菜單'
  }
  return `預訂 ${menu.date.toLocaleDateString('zh-TW', {
    month: 'long',
    day: 'numeric',
  })} ${typeName}${menu.name !== '' ? ` -${menu.name}` : ''}`
}
