import {
  getUserTokens,
  getUsersTokens,
  deleteSubscription,
  getManyOrdersCount,
} from './database'
import webpush from 'web-push'
import { settings } from '@/lib/common'

type NotificationPayload = {
  type: 'notification'
  data: {
    title: string
    message: string
    icon?: string
    tag?: string
    badge?: string
    url?: string
    ignoreIfFocused?: boolean
  }
}
type BadgePayload = {
  type: 'badge'
  data: number
}

type PushArgs = {
  sub: { endpoint: string; auth: string; p256dh: string }
} & (NotificationPayload | BadgePayload)

class WebPusher {
  constructor() {
    webpush.setVapidDetails(
      'mailto:rd@moonshine.tw',
      settings.WEBPUSH_PUBLIC_KEY,
      settings.WEBPUSH_PRIVATE_KEY,
    )
  }

  async push(props: PushArgs) {
    const { sub, type, data } = props

    // assign default value
    switch (type) {
      case 'notification':
        data.badge =
          data.badge ??
          `${settings.RESOURCE_URL}/image/${settings.RESOURCE_BADGE}`
        break
    }

    return await webpush
      .sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth,
            p256dh: sub.p256dh,
          },
        },
        JSON.stringify({
          type: type,
          data,
        }),
      )
      .then(() => ({
        endpoint: sub.endpoint,
        success: true,
      }))
      .catch(() => {
        console.error('webpush error: ', sub.endpoint)
        deleteSubscription({ endpoint: sub.endpoint })
        return {
          endpoint: sub.endpoint,
          success: false,
        }
      })
  }

  async pushBadgeCountToUser(props: { userIds: string[] }) {
    const { userIds } = props
    const badgeCounts = await getManyOrdersCount({ userIds })
    const usersSubs = await this.getUsersSubs(userIds)

    // add user id back if count is 0
    for (const userId of userIds) {
      if (!badgeCounts.find((bc) => bc.userId === userId)) {
        badgeCounts.push({
          userId,
          _count: 0,
        })
      }
    }

    const promises = usersSubs
      .filter((sub) => sub.badgeEnabled)
      .map((sub) => {
        const { userId, ...rest } = sub
        const badgeCount = badgeCounts.find((bc) => bc.userId === userId)

        if (!badgeCount) return

        return this.push({
          sub: rest,
          type: 'badge',
          data: badgeCount._count,
        })
      })

    return await Promise.all(promises)
  }

  async pushNotificationToUser(
    props: { userId: string } & NotificationPayload['data'],
  ) {
    const { userId, ...data } = props
    const userSubs = await this.getUserSubs(userId)

    const promises = userSubs
      .filter((sub) => sub.notificationEnabled)
      .map((sub) => {
        return this.push({
          sub,
          type: 'notification',
          data,
        })
      })

    return await Promise.all(promises)
  }

  async getUserSubs(userId: string) {
    const userSubs = await getUserTokens(userId)
    return userSubs
      .filter(
        (sub) =>
          sub.endpoint !== null &&
          sub.endpoint !== 'null' &&
          sub.endpoint !== 'undefined',
      )
      .map((sub) => ({
        notificationEnabled: sub.notificationEnabled,
        badgeEnabled: sub.badgeEnabled,
        endpoint: sub.endpoint!,
        auth: sub.auth!,
        p256dh: sub.p256dh!,
      }))
  }

  async getUsersSubs(userIds: string[]) {
    const usersSubs = await getUsersTokens(userIds)
    return usersSubs
      .filter(
        (sub) =>
          sub.endpoint !== null &&
          sub.endpoint !== 'null' &&
          sub.endpoint !== 'undefined',
      )
      .map((sub) => ({
        notificationEnabled: sub.notificationEnabled,
        badgeEnabled: sub.badgeEnabled,
        endpoint: sub.endpoint!,
        auth: sub.auth!,
        p256dh: sub.p256dh!,
        userId: sub.userId,
      }))
  }
}

/* Global */
declare global {
  var webPusher: WebPusher | undefined
}

export const webPusher: WebPusher = global.webPusher ?? new WebPusher()

if (process.env.NODE_ENV !== 'production') {
  global.webPusher = webPusher
}

export default webPusher
