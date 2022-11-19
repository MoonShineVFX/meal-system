import { applyWSSHandler } from '@trpc/server/adapters/ws'
import http from 'http'
import next from 'next'
import { parse } from 'url'
import ws from 'ws'

import { createContext } from './trpc'
import { appRouter } from './api/router'

const port = parseInt(process.env.PORT ?? '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })
  const wss = new ws.Server({ server })
  const handler = applyWSSHandler({ wss, router: appRouter, createContext })

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server')
    handler.broadcastReconnectNotification()
  })
  server.listen(port)

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? 'development' : 'production'
    }`,
  )
})
