import BeamsServerClient from '@pusher/push-notifications-server'

import { settings } from '@/lib/common'

declare global {
  var beamsServerClient: BeamsServerClient | undefined
}

export const beamsServerClient =
  global.beamsServerClient ??
  new BeamsServerClient({
    instanceId: settings.BEAMS_KEY,
    secretKey: settings.BEAMS_PRIVATE_KEY,
  })

if (process.env.NODE_ENV !== 'production') {
  global.beamsServerClient = beamsServerClient
}

export function generateUserBeamsToken(userId: string) {
  return beamsServerClient.generateToken(userId)
}

export function pushNotificationToUser(props: {
  users: string[]
  title: string
  body: string
  icon?: string
  link?: string
}) {
  beamsServerClient
    .publishToUsers(props.users, {
      web: {
        notification: {
          title: props.title,
          body: props.body,
          icon: props.icon,
          deep_link: props.link,
          hide_notification_if_site_has_focus: false,
        },
      },
    })
    .catch((err) => {
      console.error(err)
    })
}
