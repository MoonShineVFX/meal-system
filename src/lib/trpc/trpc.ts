import { inferAsyncReturnType, initTRPC, TRPCError } from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'
import { Role } from '@prisma/client'
import superjson from 'superjson'

import { validateAuthToken } from '@/lib/server/database'
import { settings, UserLite, validateRole } from '@/lib/common'

/* Context */
export async function createContext({
  req,
  res,
}: trpcNext.CreateNextContextOptions) {
  let userLite = null
  if (settings.COOKIE_TOKEN_NAME in req.cookies) {
    userLite = await validateAuthToken(req.cookies[settings.COOKIE_TOKEN_NAME]!)
  }

  return {
    res: res,
    req: req,
    userLite: userLite,
  }
}

export type Context = inferAsyncReturnType<typeof createContext>

/* Procedures */
const t = initTRPC.context<Context>().create({ transformer: superjson })
export const router = t.router

async function validateUserLite(
  userLite: UserLite | null,
  targetRole: Role,
  path: string | string[] | undefined,
) {
  if (!userLite || !validateRole(userLite.role, targetRole)) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: `Only ${targetRole} can access ${path}`,
    })
  }
}

export const adminProcedure = t.procedure.use(
  t.middleware(async ({ next, ctx }) => {
    await validateUserLite(ctx.userLite, Role.ADMIN, ctx.req.query.trpc)
    return next({ ctx: { userLite: ctx.userLite! } })
  }),
)

export const staffProcedure = t.procedure.use(
  t.middleware(async ({ next, ctx }) => {
    await validateUserLite(ctx.userLite, Role.STAFF, ctx.req.query.trpc)
    return next({ ctx: { userLite: ctx.userLite! } })
  }),
)

export const userProcedure = t.procedure.use(
  t.middleware(async ({ next, ctx }) => {
    await validateUserLite(ctx.userLite, Role.USER, ctx.req.query.trpc)
    return next({ ctx: { userLite: ctx.userLite! } })
  }),
)

export const publicProcedure = t.procedure
