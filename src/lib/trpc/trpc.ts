import { UserRole } from '@prisma/client'
import { inferAsyncReturnType, initTRPC, TRPCError } from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'
import superjson from 'superjson'

import { settings, validateRole } from '@/lib/common'
import { getUserLite } from '@/lib/server/database'
import { rateLimiter } from '@/lib/server/rate-limiter'

/* Context */
export async function createContext(opts: trpcNext.CreateNextContextOptions) {
  let userLite = null
  let cookies: Partial<{ [key: string]: string }> = {}

  cookies = opts.req.cookies

  if (settings.COOKIE_TOKEN_NAME in cookies) {
    userLite = await getUserLite({
      token: cookies[settings.COOKIE_TOKEN_NAME]!,
    })
  }

  return {
    req: opts.req,
    res: opts.res,
    userLite: userLite,
    host: opts.req.headers.origin!,
  }
}

export type Context = inferAsyncReturnType<typeof createContext>

/* Procedures */
const t = initTRPC
  .meta<{
    rateLimit?: {
      perSecond?: number
      perMinute?: number
    }
  }>()
  .context<Context>()
  .create({
    transformer: superjson,
  })
export const router = t.router

export const commonProcedure = t.procedure.use(
  t.middleware(async ({ next, ctx, meta }) => {
    // Rate Limiter
    if (meta?.rateLimit) {
      if (!ctx.userLite) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '未登入',
        })
      }

      try {
        if (meta.rateLimit.perSecond) {
          await rateLimiter.consume(
            ctx.userLite.id,
            meta.rateLimit.perSecond,
            'perSecond',
          )
        }
        if (meta.rateLimit.perMinute) {
          await rateLimiter.consume(
            ctx.userLite.id,
            meta.rateLimit.perMinute,
            'perMinute',
          )
        }
      } catch (e) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: '請求過於頻繁，請稍後重試',
        })
      }
    }

    return next()
  }),
)

export const userProcedure = commonProcedure.use(
  t.middleware(async ({ next, ctx }) => {
    if (!ctx.userLite) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '未登入',
      })
    }
    return next({ ctx: { userLite: ctx.userLite! } })
  }),
)

export const staffProcedure = userProcedure.use(
  t.middleware(async ({ next, ctx }) => {
    if (!ctx.userLite || !validateRole(ctx.userLite.role, UserRole.STAFF)) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '未授權',
      })
    }
    return next({ ctx: { userLite: ctx.userLite! } })
  }),
)
