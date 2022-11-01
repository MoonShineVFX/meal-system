import { User } from '@prisma/client'

/* Settings */
export const settings = {
  /* Auth */
  COOKIE_NAME: 'meal_token',
  COOKIE_EXPIRE_DAYS: 14,
  /* Cached */
  CACHED_MAX_LENGTH: 10000,
  PURGE_AMOUNT: 5000,
  /* Database */
  TOKEN_COUNT_PER_USER: 10,
}

/* Types */
export type UserLite = Pick<User, 'id' | 'name' | 'role'>

/* Functions */

export function generateCookie(token: string | undefined) {
  const expireTime = token ? settings.COOKIE_EXPIRE_DAYS * 24 * 60 * 60 : 0
  return `${settings.COOKIE_NAME}=${token}; Max-Age=${expireTime}; Path=/; SameSite=Strict; HttpOnlyl`
}
