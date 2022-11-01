import { authProcedure, publicProcedure, router } from '@/trpc/init'
import { createAuthToken, ensureUser, getUserInfo } from '@/utils/database'
import { settings, generateCookie } from '@/utils/settings'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const UserRouter = router({
  info: authProcedure.query(async ({ ctx }) => {
    const user = await getUserInfo(ctx.userLite.id)

    if (!user) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `User not found: ${ctx.userLite.id}`,
      })
    }

    // Extend cookie duration
    ctx.res.setHeader(
      'Set-Cookie',
      generateCookie(ctx.req.cookies[settings.COOKIE_NAME]!)
    )

    return user
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

      // If AD invalid
      if (input.username === 'error') {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid username or password',
        })
        return
      }

      // Generate token and set cookie
      const user = await ensureUser('wang', '王小明')
      const token = await createAuthToken(user.id)
      ctx.res.setHeader('Set-Cookie', generateCookie(token))

      return
    }),
})
