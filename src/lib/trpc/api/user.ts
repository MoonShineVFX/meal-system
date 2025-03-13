import { generateCookie, settings, UserAuthorityName } from '@/lib/common'
import { PUSHER_CHANNEL, PUSHER_EVENT } from '@/lib/common/pusher'
import {
  createUserToken,
  deleteSubscription,
  deleteUserToken,
  ensureUser,
  getUserInfo,
  getUserList,
  getUsersStatistics,
  getUserToken,
  updateUserAuthority,
  updateUserToken,
  validateUserPassword,
} from '@/lib/server/database'
import { emitPusherEvent } from '@/lib/server/pusher'
import webPusher from '@/lib/server/webpush'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { UserAuthority } from '@prisma/client'
import { publicProcedure, router, staffProcedure, userProcedure } from '../trpc'

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
    const userInfo = await getUserInfo(ctx.userLite.id)

    if (!userInfo) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: `User not found: ${ctx.userLite.id}`,
      })
    }

    if (userInfo.isRedeemed) {
      emitPusherEvent(PUSHER_CHANNEL.USER(ctx.userLite.id), {
        type: PUSHER_EVENT.BONUS_REDEEMED,
      })
    }

    return userInfo.user
  }),
  getList: staffProcedure.query(async () => {
    return await getUserList()
  }),
  login: publicProcedure
    .input(
      z.object({
        // AD username is case insensitive
        username: z.string().toLowerCase().min(1),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Use mock user if dev mode
      if (
        process.env.NODE_ENV !== 'production' &&
        input.username.startsWith('_')
      ) {
        await ensureUser({ userId: input.username })
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

          // Filter intern
          const isIntern = userAdData.ou === 'Classroom'

          // Generate token and set cookie
          await ensureUser({
            userId: input.username,
            name: userAdData.truename,
            password: input.password,
            email: userAdData.mail,
            isIntern,
          })
        }
      }

      const token = await createUserToken(input.username)

      // Set cookie if http request
      if (ctx.res) {
        ctx.res.setHeader('Set-Cookie', generateCookie(token))
      }

      return { token }
    }),
  logout: userProcedure.mutation(async ({ ctx }) => {
    await deleteUserToken(ctx.userLite.token)
  }),
  getToken: userProcedure.query(async ({ ctx }) => {
    return await getUserToken(ctx.userLite.token)
  }),
  // updateSettings: userProcedure
  //   .input(
  //     z.object({
  //       qrcodeAutoCheckout: z.boolean().optional(),
  //       notificationSound: z.boolean().optional(),
  //     }),
  //   )
  //   .mutation(async ({ input, ctx }) => {
  //     await updateUserSettings({ userId: ctx.userLite.id, ...input })
  //     sendNotification(PusherChannelName.USER_NOTIFY(ctx.userLite.id), {
  //       type: SERVER_EVENT.USER_SETTINGS_UPDATE,
  //     })
  //   }),
  updateToken: userProcedure
    .input(
      z.object({
        notificationEnabled: z.boolean().optional(),
        badgeEnabled: z.boolean().optional(),
        auth: z.string().optional(),
        endpoint: z.string().optional(),
        p256dh: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await updateUserToken({
        userToken: ctx.userLite.token,
        ...input,
      })

      // update app badge
      if (input.badgeEnabled || input.endpoint) {
        webPusher.pushBadgeCountToUser({
          userIds: [ctx.userLite.id],
        })
      }
    }),
  deleteSubscription: publicProcedure
    .input(
      z.object({
        endpoint: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await deleteSubscription({
        endpoint: input.endpoint,
      })
    }),
  getBadgeCount: userProcedure.mutation(async ({ ctx }) => {
    await webPusher.pushBadgeCountToUser({
      userIds: [ctx.userLite.id],
    })
  }),
  testPushNotification: userProcedure.mutation(async ({ ctx }) => {
    const result = await webPusher.pushNotificationToUser({
      userId: ctx.userLite.id,
      title: '測試推送通知',
      message: '有看到就表示通知功能正常',
      tag: 'test',
      url: `${settings.WEBSITE_URL}/deposit`,
    })

    const count = result.filter((r) => r.success)
    emitPusherEvent(PUSHER_CHANNEL.USER(ctx.userLite.id), {
      type: PUSHER_EVENT.USER_TEST_PUSH_NOTIFICATION,
      message: `送出 ${count.length} 個推送通知，成功 ${count.length} 個`,
    })
  }),
  getStatistics: staffProcedure
    .input(
      z.object({
        showDeactivated: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      return await getUsersStatistics(input)
    }),
  updateAuthority: staffProcedure
    .input(
      z.object({
        userId: z.string(),
        authority: z.nativeEnum(UserAuthority),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await updateUserAuthority(input)
      console.log(user)

      if (!user) return

      const updateMessage = `的${UserAuthorityName[input.authority]}權限已${
        input.enabled ? '啟用' : '停用'
      }`

      emitPusherEvent(PUSHER_CHANNEL.STAFF, {
        type: PUSHER_EVENT.USER_AUTHORIY_UPDATE,
        message: `用戶 ${user.name} ${updateMessage}`,
      })
      emitPusherEvent(PUSHER_CHANNEL.USER(input.userId), {
        type: PUSHER_EVENT.USER_AUTHORIY_UPDATE,
        message: `您${updateMessage}`,
      })
    }),
})
