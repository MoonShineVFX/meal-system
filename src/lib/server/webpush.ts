import { getUserSubscriptions, deleteSubscription } from './database'
import webpush from 'web-push'
import { settings } from '@/lib/common'

webpush.setVapidDetails(
  'mailto:rd@moonshine.tw',
  settings.WEBPUSH_PUBLIC_KEY,
  settings.WEBPUSH_PRIVATE_KEY,
)

export async function sendNotificationToUser(props: {
  userId: string
  title: string
  message: string
  icon?: string
  tag?: string
}) {
  const { userId, title, message, icon, tag } = props
  const userSubs = await getUserSubscriptions(userId)

  const promises = userSubs.map((sub) => {
    return webpush
      .sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth,
            p256dh: sub.p256dh,
          },
        },
        JSON.stringify({
          title,
          options: {
            body: message,
            icon: icon,
            tag: tag,
            badge: `${settings.RESOURCE_URL}/image/${settings.RESOURCE_BADGE}`,
          },
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
  })
  return await Promise.all(promises)
}
