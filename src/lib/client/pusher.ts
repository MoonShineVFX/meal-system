import Pusher from 'pusher-js'

import { settings } from '@/lib/common'

// class PusherClient {
//   private _pusher: Pusher
//   private channel: Channel

//   constructor() {
//     this._pusher = new Pusher(settings.PUSHER_KEY, {
//       cluster: settings.PUSHER_CLUSTER,
//     })

//     this.channel = this._pusher.subscribe('test-channel')
//   }

//   public getChannel() {
//     return this.channel
//   }
// }

/* Global */
declare global {
  var pusherClient: Pusher | undefined
}

const pusherClient =
  global.pusherClient ??
  new Pusher(settings.PUSHER_KEY, {
    wsHost: settings.PUSHER_HOST,
    forceTLS: true,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.pusherClient = pusherClient
}

export default pusherClient
