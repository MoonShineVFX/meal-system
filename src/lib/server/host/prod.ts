import http from 'http'
import next from 'next'
import { parse } from 'url'

import { settings } from '@/lib/common'
import { createWebSocketServer } from '@/lib/trpc'

const port = parseInt(settings.HTTP_PORT, 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const { handler } = createWebSocketServer(server)

  process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, closing server')
    handler.broadcastReconnectNotification()
  })
  server.listen(port)

  console.log(
    `[Server] listening at http://localhost:${port} as ${
      dev ? 'development' : 'production'
    }`,
  )
})
