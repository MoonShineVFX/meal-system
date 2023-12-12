import { UserRole } from '@prisma/client'
import { inferAsyncReturnType, initTRPC, TRPCError } from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'
import { NodeHTTPCreateContextFnOptions } from '@trpc/server/adapters/node-http'
import { IncomingMessage } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import superjson from 'superjson'
import ws from 'ws'

import { settings, validateRole } from '@/lib/common'
import { getUserLite } from '@/lib/server/database'
import { rateLimiter } from '@/lib/server/rate-limiter'

type UserLite = Awaited<ReturnType<typeof getUserLite>>

/* Context */
function parseCookies(request: IncomingMessage) {
  const cookies: { [key: string]: string } = {}
  const cookieHeader = request.headers?.cookie
  if (!cookieHeader) return cookies

  cookieHeader.split(`;`).forEach(function (cookie) {
    let [name, ...rest] = cookie.split(`=`)
    name = name?.trim()
    if (!name) return
    const value = rest.join(`=`).trim()
    if (!value) return
    cookies[name] = decodeURIComponent(value)
  })

  return cookies
}

export async function createContext(
  opts:
    | trpcNext.CreateNextContextOptions
    | NodeHTTPCreateContextFnOptions<IncomingMessage, ws>,
) {
  let userLite = null
  const isSocket = opts.res instanceof ws
  let cookies: Partial<{ [key: string]: string }> = {}

  if (isSocket) {
    cookies = parseCookies(opts.req)
  } else {
    cookies = (opts.req as NextApiRequest).cookies
  }

  if (settings.COOKIE_TOKEN_NAME in cookies) {
    userLite = await getUserLite({
      token: cookies[settings.COOKIE_TOKEN_NAME]!,
    })
  }

  return {
    req: opts.req,
    res: isSocket ? undefined : (opts.res as NextApiResponse),
    ws: isSocket ? (opts.res as ws) : undefined,
    userLite: userLite,
    host: opts.req.headers.origin!,
  }
}

export type Context = inferAsyncReturnType<typeof createContext>

/* Procedures */
const t = initTRPC.context<Context>().create({ transformer: superjson })
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
