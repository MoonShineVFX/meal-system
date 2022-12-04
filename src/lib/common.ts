import { User, TransactionType, UserRole, Transaction } from '@prisma/client'

/* Settings */
export const settings = {
  /* Auth */
  AUTH_API_URL: process.env.AUTH_API_URL!,
  COOKIE_TOKEN_NAME: 'meal_token',
  COOKIE_EXPIRE_DAYS: 14,
  /* Cached */
  CACHED_MAX_LENGTH: 10000,
  PURGE_AMOUNT: 5000,
  /* Events */
  EVENT_EXPIRE_MINS: 10,
  NOTIFICATION_DURATION: 3500,
  NOTIFICATION_DELAY: 500,
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
  WEBSOCKET_PORT: process.env.NEXT_PUBLIC_WEBSOCKET_PORT ?? '3001',
  HTTP_PORT: process.env.PORT ?? '3000',
  /* Blockchain */
  BLOCKCHAIN_URL: process.env.BLOCKCHAIN_URL!,
  BLOCKCHAIN_CREDIT_ADDRESS: process.env.BLOCKCHAIN_CREDIT_ADDRESS!,
  BLOCKCHAIN_POINT_ADDRESS: process.env.BLOCKCHAIN_POINT_ADDRESS!,
  BLOCKCHAIN_PRIVATE_KEY: process.env.BLOCKCHAIN_PRIVATE_KEY!,
  BLOCKCHAIN_GAS_PRICE: 5,
  BLOCKCHAIN_GAS: 200000,
  BLOCKCHAIN_NONCE_REFRESH_TIME: 1000 * 60,
  /* Log */
  LOG_BLOCKCHAIN: process.env.LOG_BLOCKCHAIN === 'true',
  LOG_DATABASE: process.env.LOG_DATABASE === 'true',
  /* Misc */
  REPORT_URL: process.env.NEXT_PUBLIC_REPORT_URL ?? '',
  TITLE: process.env.NEXT_PUBLIC_TITLE ?? '夢想餐飲',
}

/* Types */
export type UserLite = Pick<User, 'id' | 'name' | 'role'>

export type TransactionWithName = Transaction & {
  sourceUser: {
    name: string
  }
  targetUser: {
    name: string
  }
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
