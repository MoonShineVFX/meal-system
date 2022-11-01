import { User } from '@prisma/client'

/* Settings */
export const settings = {
  /* cached */
  CACHED_MAX_LENGTH: 10000,
  PURGE_AMOUNT: 5000,
  /* database */
  TOKEN_COUNT_PER_USER: 10,
}

/* Types */
export type UserLite = Pick<User, 'id' | 'name' | 'role'>
