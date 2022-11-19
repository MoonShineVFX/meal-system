import { User, TransactionType, Role, Transaction } from '@prisma/client'

/* Settings */
export const settings = {
  /* Auth */
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
    [TransactionType.ORDER]: '訂單',
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
  /* URL */
  AUTH_API_URL: process.env.AUTH_API_URL!,
  WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL!,
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

/* Functions */
export function generateCookie(token: string | undefined) {
  const expireTime = token ? settings.COOKIE_EXPIRE_DAYS * 24 * 60 * 60 : 0
  return `${settings.COOKIE_TOKEN_NAME}=${token}; Max-Age=${expireTime}; Path=/; SameSite=Strict`
}

export function validateRole(sourceRole: Role, targetRole: Role) {
  const roleWeight = {
    [Role.SERVER]: 1000,
    [Role.ADMIN]: 100,
    [Role.STAFF]: 50,
    [Role.USER]: 10,
  }

  return roleWeight[sourceRole] >= roleWeight[targetRole]
}
