import fetch from 'node-fetch'

import { createWebSocketServer } from '@/lib/trpc'

if (!global.fetch) {
  ;(global as any).fetch = fetch
}

const { wss, handler } = createWebSocketServer()

console.log('[WS] Websocket server started on port 3001')

process.on('SIGTERM', () => {
  console.log('[WS] SIGTERM received, closing websocket server')
  handler.broadcastReconnectNotification()
  wss.close()
})
