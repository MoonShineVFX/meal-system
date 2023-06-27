import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { observable } from '@trpc/server/observable'

import webPusher from '@/lib/server/webpush'
import {
  createUserToken,
  ensureUser,
  getUserInfo,
  validateUserPassword,
  addUserSubscription,
  deleteSubscription,
} from '@/lib/server/database'
import {
  settings,
  generateCookie,
  ServerNotifyPayload,
  SERVER_NOTIFY,
} from '@/lib/common'
import { ServerChannelName, eventEmitter } from '@/lib/server/event'

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
    const userInfo = await getUserInfo(ctx.userLite.id)

    if (!userInfo) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `User not found: ${ctx.userLite.id}`,
      })
    }

    if (userInfo.isRecharged) {
      eventEmitter.emit(ServerChannelName.USER_NOTIFY(ctx.userLite.id), {
        type: SERVER_NOTIFY.DAILY_RECHARGE,
      })
    }

    return userInfo.user
  }),
  onNotify: userProcedure.subscription(async ({ ctx }) => {
    return observable<ServerNotifyPayload>((observer) => {
      const listener = (notifyPayload: ServerNotifyPayload) => {
        observer.next(notifyPayload)
      }

      const channelNames: string[] = []
      channelNames.push(
        ServerChannelName.USER_NOTIFY(ctx.userLite.id),
        ServerChannelName.PUBLIC_NOTIFY,
      )
      if (ctx.userLite.role === 'STAFF' || ctx.userLite.role === 'ADMIN') {
        channelNames.push(ServerChannelName.STAFF_NOTIFY)
      }

      for (const channelName of channelNames) {
        eventEmitter.on(channelName, listener)
      }
      return () => {
        for (const channelName of channelNames) {
          eventEmitter.off(channelName, listener)
        }
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

          // Generate token and set cookie
          await ensureUser({
            userId: input.username,
            name: userAdData.truename,
            password: input.password,
            email: userAdData.mail,
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
  // updateSettings: userProcedure
  //   .input(
  //     z.object({
  //       qrcodeAutoCheckout: z.boolean().optional(),
  //       notificationSound: z.boolean().optional(),
  //     }),
  //   )
  //   .mutation(async ({ input, ctx }) => {
  //     await updateUserSettings({ userId: ctx.userLite.id, ...input })
  //     eventEmitter.emit(ServerChannelName.USER_NOTIFY(ctx.userLite.id), {
  //       type: SERVER_NOTIFY.USER_SETTINGS_UPDATE,
  //     })
  //   }),
  addSubscription: userProcedure
    .input(
      z.object({
        auth: z.string(),
        endpoint: z.string(),
        p256dh: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await addUserSubscription({
        userToken: ctx.userLite.token,
        auth: input.auth,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
      })

      // update app badge
      webPusher.pushBadgeCountToUser({
        userId: ctx.userLite.id,
      })
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
  testPushNotification: userProcedure.mutation(async ({ ctx }) => {
    const result = await webPusher.pushNotificationToUser({
      userId: ctx.userLite.id,
      title: '測試推送通知',
      message: '有看到就表示通知功能正常',
      tag: 'test',
      url: `${settings.WEBSITE_URL}/deposit`,
    })

    const count = result.filter((r) => r.success)
    eventEmitter.emit(ServerChannelName.USER_NOTIFY(ctx.userLite.id), {
      type: SERVER_NOTIFY.USER_TEST_PUSH_NOTIFICATION,
      message: `送出 ${count.length} 個推送通知，成功 ${count.length} 個`,
    })
  }),
})
