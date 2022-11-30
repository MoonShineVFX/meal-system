import { inferAsyncReturnType, initTRPC, TRPCError } from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'
import { UserRole } from '@prisma/client'
import superjson from 'superjson'
import { IncomingMessage } from 'http'
import { NodeHTTPCreateContextFnOptions } from '@trpc/server/adapters/node-http'
import ws from 'ws'
import { NextApiRequest, NextApiResponse } from 'next'

import { validateAuthToken } from '@/lib/server/database'
import { settings, UserLite, validateRole } from '@/lib/common'

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
    userLite = await validateAuthToken(cookies[settings.COOKIE_TOKEN_NAME]!)
  }

  return {
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
  userLite: UserLite | null,
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
