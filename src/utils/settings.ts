import { User, TransactionType } from '@prisma/client'

/* Settings */
export const settings = {
  /* Auth */
  AUTH_API_URL: process.env.AUTH_API_URL,
  COOKIE_TOKEN_NAME: 'meal_token',
  COOKIE_EVENT_DATE_NAME: 'event_date',
  COOKIE_EXPIRE_DAYS: 14,
  /* Cached */
  CACHED_MAX_LENGTH: 10000,
  PURGE_AMOUNT: 5000,
  /* Events */
  EVENT_EXPIRE_MINS: 10,
  /* Database */
  TOKEN_COUNT_PER_USER: 10,
  SERVER_USER_ID: '_server',
  TRANSACTION_NAME: {
    [TransactionType.RECHARGE]: '儲值',
    [TransactionType.PAYMENT]: '消費',
    [TransactionType.REFUND]: '退款',
    [TransactionType.RESERVE]: '預訂',
  },
  /* Trade */
  RECORDS_PER_PAGE: 10,
}

/* Types */
export type UserLite = Pick<User, 'id' | 'name' | 'role'>

/* Functions */

export function generateCookie(token: string | undefined) {
  const expireTime = token ? settings.COOKIE_EXPIRE_DAYS * 24 * 60 * 60 : 0
  return `${settings.COOKIE_TOKEN_NAME}=${token}; Max-Age=${expireTime}; Path=/; SameSite=Strict; HttpOnlyl`
}
