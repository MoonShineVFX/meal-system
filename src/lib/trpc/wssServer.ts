import { applyWSSHandler } from '@trpc/server/adapters/ws'
import ws from 'ws'
import fetch from 'node-fetch'

import { createContext } from './trpc'
import { appRouter } from './api/router'
import { settings } from '@/lib/common'

if (!global.fetch) {
  ;(global as any).fetch = fetch
}

const wss = new ws.Server({ port: parseInt(settings.WEBSOCKET_PORT, 10) })
const handler = applyWSSHandler({ wss, router: appRouter, createContext })

wss.on('connection', (ws, req) => {
  console.log(`Conection added (${wss.clients.size})`)
  ws.once('close', () => {
    console.log(`Conection removed (${wss.clients.size})`)
  })
})

console.log('Websocket server started on port 3001')

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing websocket server')
  handler.broadcastReconnectNotification()
  wss.close()
})
