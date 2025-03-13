import { UserRole } from '@prisma/client'
import { inferAsyncReturnType, initTRPC, TRPCError } from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'
import superjson from 'superjson'

import { settings, validateRole } from '@/lib/common'
import { getUserLite } from '@/lib/server/database'
import { rateLimiter } from '@/lib/server/rate-limiter'

type UserLite = Awaited<ReturnType<typeof getUserLite>>

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
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  sse: {
    maxDurationMs: 5 * 60 * 1000, // 5 minutes
    ping: {
      enabled: true,
      intervalMs: 10 * 1000, // 10 seconds
    },
    client: {
      reconnectAfterInactivityMs: 60 * 1000, // 1 minute
    },
  },
})
export const router = t.router

async function validateUserLite(
  userLite: UserLite,
  targetRole: UserRole,
  path?: string | string[],
) {
  if (!userLite || !validateRole(userLite.role, targetRole)) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: `Only ${targetRole} can access ${path}`,
    })
  }
}

export const adminProcedure = t.procedure.use(
  t.middleware(async ({ next, ctx, path }) => {
    await validateUserLite(ctx.userLite, UserRole.ADMIN, path)
    return next({ ctx: { userLite: ctx.userLite! } })
  }),
)

export const staffProcedure = t.procedure.use(
  t.middleware(async ({ next, ctx, path }) => {
    await validateUserLite(ctx.userLite, UserRole.STAFF, path)
    return next({ ctx: { userLite: ctx.userLite! } })
  }),
)

export const userProcedure = t.procedure.use(
  t.middleware(async ({ next, ctx, path }) => {
    await validateUserLite(ctx.userLite, UserRole.USER, path)
    return next({ ctx: { userLite: ctx.userLite! } })
  }),
)

export const publicProcedure = t.procedure

/* Rate Limiter */
export const rateLimitUserProcedure = userProcedure.use(
  async ({ next, ctx }) => {
    try {
      await rateLimiter.consume(ctx.userLite.id, 1)
    } catch (e) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '交易過於頻繁，請稍後重試',
      })
    }

    return next({ ctx: { userLite: ctx.userLite! } })
  },
)
