import Pusher from 'pusher'
import { settings } from '@/lib/common'

// class PusherServer {
//   private _pusher: Pusher

//   constructor() {
//     this._pusher = new Pusher({
//       appId: secrets.PUSHER_APP_ID,
//       key: settings.PUSHER_KEY,
//       secret: secrets.PUSHER_SECRET,
//       cluster: settings.PUSHER_CLUSTER,
//       useTLS: process.env.NODE_ENV === 'production',
//     })
//   }
// }

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
