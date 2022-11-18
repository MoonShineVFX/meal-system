import Pusher from 'pusher'
import { settings } from '@/lib/common'

/* Global */
declare global {
  var pusherServer: Pusher | undefined
}

const pusherServer =
  global.pusherServer ??
  new Pusher({
    appId: settings.PUSHER_APP_ID,
    key: settings.PUSHER_KEY,
    secret: settings.PUSHER_SECRET,
    host: settings.PUSHER_HOST,
    useTLS: true,
    port: '443',
  })

if (process.env.NODE_ENV !== 'production') {
  global.pusherServer = pusherServer
}

export default pusherServer
