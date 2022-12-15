import { TransactionType, UserRole, Menu } from '@prisma/client'

/* Types */
export enum SERVER_NOTIFY {
  CART_ADD = '加入購物車成功',
  CART_DELETE = '移除購物車餐點成功',
  CART_UPDATE = '修改購物車餐點成功',
}

export enum CurrencyType {
  CREDIT = 'credit',
  POINT = 'point',
}

export type OptionSet = {
  name: string
  multiSelect: boolean
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
  NOTIFICATION_DELAY_MS: 500,
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

export function validateRole(sourceRole: UserRole, targetRole: UserRole) {
  const roleWeight = {
    [UserRole.ADMIN]: 100,
    [UserRole.STAFF]: 50,
    [UserRole.USER]: 10,
  }

  return roleWeight[sourceRole] >= roleWeight[targetRole]
}

export function twData(parms: Record<string, boolean | undefined>) {
  return Object.entries(parms)
    .map(([key, value]) => (value ? key : `not-${key}`))
    .join(' ')
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
