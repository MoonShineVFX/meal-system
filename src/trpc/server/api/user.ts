import { userProcedure, publicProcedure, router } from '../server'
import { createAuthToken, ensureUser, getUserInfo } from '@/utils/database'
import { settings, generateCookie } from '@/utils/settings'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

type UserAdData = {
  group: string[]
  mail: string
  mobile: string // '0912345678'
  ou: string // 'Employee'
  title: string // 'VFX Artist'
  truename: string
  username: string
}

export const UserRouter = router({
  info: userProcedure.query(async ({ ctx }) => {
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
      generateCookie(ctx.req.cookies[settings.COOKIE_TOKEN_NAME]!),
    )

    return user
  }),
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const adTokenResponse = await fetch(`${settings.AUTH_API_URL}/login`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${input.username}:${input.password}`,
          ).toString('base64')}`,
        },
      })

      if (!adTokenResponse.ok) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '錯誤的帳號或密碼',
        })
        return
      }

      const adToken = await adTokenResponse.text()
      const userAdDataResponse = await fetch(`${settings.AUTH_API_URL}/user`, {
        headers: { Authorization: `auth_token ${adToken}` },
      })

      if (!userAdDataResponse.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '找不到用戶資訊',
        })
        return
      }

      const userAdData = (await userAdDataResponse.json()) as UserAdData

      // Generate token and set cookie
      const user = await ensureUser(input.username, userAdData.truename)
      const token = await createAuthToken(user.id)
      ctx.res.setHeader('Set-Cookie', generateCookie(token))

      return
    }),
})
