import { applyWSSHandler } from '@trpc/server/adapters/ws'
import ws, { WebSocketServer } from 'ws'

import { createContext } from './trpc'
import { appRouter } from './api/router'
import { settings } from '@/lib/common'

export function createWebSocketServer(server?: ws.ServerOptions['server']) {
  const wss = new WebSocketServer({
    server: server,
    port: server ? undefined : parseInt(settings.WEBSOCKET_DEV_PORT, 10),
  })
  const handler = applyWSSHandler({ wss, router: appRouter, createContext })

  wss.on('connection', (ws, req) => {
    console.log(`[WS] Conection added (${wss.clients.size})`)
    ws.once('close', () => {
      console.log(`[WS] Conection removed (${wss.clients.size})`)
    })
  })

  return {
    wss,
    handler,
  }
}
