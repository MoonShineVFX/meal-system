import { User } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { observable } from '@trpc/server/observable'

import {
  createUserToken,
  ensureUser,
  getUserInfo,
  validateUserPassword,
} from '@/lib/server/database'
import { settings, generateCookie } from '@/lib/common'
import { Event, eventEmitter } from '@/lib/server/event'

import { userProcedure, publicProcedure, router } from '../trpc'

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
  get: userProcedure.query(async ({ ctx }) => {
    const user = await getUserInfo(ctx.userLite.id)

    if (!user) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `User not found: ${ctx.userLite.id}`,
      })
    }

    return user
  }),
  onUpdate: userProcedure.subscription(({ ctx }) => {
    return observable<User>((observer) => {
      const listener = (user: User) => {
        observer.next(user)
      }

      const eventName = Event.USER_UPDATE(ctx.userLite.id)
      eventEmitter.on(eventName, listener)
      return () => {
        eventEmitter.off(eventName, listener)
      }
    })
  }),
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Use mock user if dev mode
      if (
        process.env.NODE_ENV !== 'production' &&
        input.username.startsWith('_')
      ) {
        await ensureUser(input.username)
      } else {
        // Check user existence
        const result = await validateUserPassword(
          input.username,
          input.password,
        )

        if (!result) {
          // Validate from LDAP
          const adTokenResponse = await fetch(
            `${settings.AUTH_API_URL}/login`,
            {
              method: 'POST',
              headers: {
                Authorization: `Basic ${Buffer.from(
                  `${input.username}:${input.password}`,
                ).toString('base64')}`,
              },
            },
          )

          if (!adTokenResponse.ok) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: '帳號或密碼錯誤',
            })
          }

          const adToken = await adTokenResponse.text()
          const userAdDataResponse = await fetch(
            `${settings.AUTH_API_URL}/user`,
            {
              headers: { Authorization: `auth_token ${adToken}` },
            },
          )

          if (!userAdDataResponse.ok) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: '找不到用戶資訊',
            })
          }

          const userAdData = (await userAdDataResponse.json()) as UserAdData

          // Generate token and set cookie
          await ensureUser(input.username, userAdData.truename, input.password)
        }
      }

      const token = await createUserToken(input.username)

      // Set cookie if http request
      if (ctx.res) {
        ctx.res.setHeader('Set-Cookie', generateCookie(token))
      }

      return { token }
    }),
})
