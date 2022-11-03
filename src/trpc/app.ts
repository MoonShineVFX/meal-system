import { validateAuthToken, validateRole } from '@/utils/database'
import { inferAsyncReturnType, initTRPC, TRPCError } from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'
import { Role } from '@prisma/client'
import { UserLite } from '@/utils/settings'

/* Context */
export async function createContext({
  req,
  res,
}: trpcNext.CreateNextContextOptions) {
  let userLite = null
  if ('meal_token' in req.cookies) {
    userLite = await validateAuthToken(req.cookies.meal_token!)
  }

  return {
    res: res,
    req: req,
    userLite: userLite,
  }
}

export type Context = inferAsyncReturnType<typeof createContext>

/* Procedures */
const t = initTRPC.context<Context>().create()
export const router = t.router

async function validateUserLite(
  userLite: UserLite | null,
  targetRole: Role,
  path: string | string[] | undefined
) {
  if (!userLite || !(await validateRole(userLite.role, targetRole))) {
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
  })
)

export const staffProcedure = t.procedure.use(
  t.middleware(async ({ next, ctx }) => {
    await validateUserLite(ctx.userLite, Role.STAFF, ctx.req.query.trpc)
    return next({ ctx: { userLite: ctx.userLite! } })
  })
)

export const userProcedure = t.procedure.use(
  t.middleware(async ({ next, ctx }) => {
    await validateUserLite(ctx.userLite, Role.USER, ctx.req.query.trpc)
    return next({ ctx: { userLite: ctx.userLite! } })
  })
)

export const publicProcedure = t.procedure
