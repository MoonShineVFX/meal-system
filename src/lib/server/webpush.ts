import { getUserSubscriptions, deleteSubscription } from './database'
import webpush from 'web-push'
import { settings } from '@/lib/common'
import { UserSubscription } from '@prisma/client'

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
  sub: Pick<UserSubscription, 'endpoint' | 'auth' | 'p256dh'>
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

  async pushNotificationToUser(
    props: { userId: string } & NotificationPayload['data'],
  ) {
    const { userId, ...data } = props
    const userSubs = await getUserSubscriptions(userId)

    const promises = userSubs.map((sub) => {
      return this.push({
        sub,
        type: 'notification',
        data,
      })
    })

    return await Promise.all(promises)
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
