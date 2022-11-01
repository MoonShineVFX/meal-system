import { validateAuthToken } from '@/utils/database'
import { inferAsyncReturnType, initTRPC, TRPCError } from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'

const t = initTRPC.context<Context>().create()

/* Routers and Procedures */
export const router = t.router
export const publicProcedure = t.procedure

const authMiddleware = t.middleware(async ({ next, ctx }) => {
  if (!('meal_token' in ctx.req.cookies)) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No token provided',
    })
  }

  const userLite = await validateAuthToken(ctx.req.cookies.meal_token!)
  if (!userLite) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Token is invalid',
    })
  }

  return next({
    ctx: {
      userLite,
    },
  })
})

export const authProcedure = t.procedure.use(authMiddleware)

/* Context */
export async function createContext({
  req,
  res,
}: trpcNext.CreateNextContextOptions) {
  return {
    res: res,
    req: req,
  }
}

export type Context = inferAsyncReturnType<typeof createContext>
