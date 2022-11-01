import { authProcedure, publicProcedure, router } from '@/trpc/init'
import { createAuthToken, ensureUser } from '@/utils/database'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const UserRouter = router({
  info: authProcedure.query(async ({ ctx }) => {
    return ctx.user
  }),
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: AD integration

      // if AD invalid
      if (input.username === 'error') {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid username or password',
        })
        return
      }

      // generate token
      const user = await ensureUser('wang', '王小明')
      const token = await createAuthToken(user.id)
      ctx.res.setHeader(
        'Set-Cookie',
        `meal_token=${token}; Expires=${new Date(
          new Date().getTime() + 86409000
        ).toUTCString()}; Path=/`
      )

      return
    }),
})
