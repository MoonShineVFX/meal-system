import { TransactionType, UserRole, Menu, MenuType } from '@prisma/client'

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
  /* Events */
  NOTIFICATION_DURATION_MS: 3500,
  /* Database */
  TOKEN_COUNT_PER_USER: 10,
  SERVER_USER_ID: '_server',
  POINT_DAILY_RECHARGE_AMOUNT: process.env.POINT_DAILY_RECHARGE_AMOUNT
    ? parseInt(process.env.POINT_DAILY_RECHARGE_AMOUNT)
    : 100,
  /* Trade */
  TRANSACTIONS_PER_QUERY: 20,
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
  /* Order */
  ORDER_TAKE_PER_QUERY: 20,
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

export function getMenuName(menu?: Pick<Menu, 'date' | 'name' | 'type'>) {
  if (menu === undefined) return undefined

  if (menu.type === 'LIVE') return '即時點餐'
  if (menu.type === 'RETAIL') return '自助'
  if (menu.date === null) return '錯誤菜單'
  const typeName = MenuTypeName[menu.type]

  return `${menu.date.toLocaleDateString('zh-TW', {
    month: 'long',
    day: 'numeric',
  })} ${typeName}${menu.name !== '' ? ` -${menu.name}` : ''}`
}
