import { PrismaClient } from '@prisma/client'

import { settings } from '@/lib/common'

/* Function */
export function log(...args: Parameters<typeof console.log>) {
  if (settings.LOG_DATABASE) {
    console.log('[Database]', ...args)
  }
}

export function logError(...args: Parameters<typeof console.error>) {
  console.error('[Database]', ...args)
}

/* Global */
declare global {
  var prisma: PrismaClient | undefined
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV !== 'production'
        ? ['error', 'warn'] // ['query'] if wanted
        : ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
