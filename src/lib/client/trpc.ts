import {
  loggerLink,
  createWSClient,
  wsLink,
  TRPCLink,
  httpBatchLink,
} from '@trpc/client'
import type { inferRouterOutputs } from '@trpc/server'
import { createTRPCNext } from '@trpc/next'
import superjson from 'superjson'
import { observable } from '@trpc/server/observable'

import { generateCookie, settings } from '@/lib/common'
import type { AppRouter } from '@/lib/trpc'

export const onSocketOpenCallbacks: (() => void)[] = []
export const onSocketCloseCallbacks: (() => void)[] = []

/* Types */
export type RouterOutput = inferRouterOutputs<AppRouter>

/* WebSocket Client */
declare global {
  var wsClient: ReturnType<typeof createWSClient> | undefined
}
function getWSClient() {
  const wsClient =
    global.wsClient ??
    createWSClient({
      url: `${window.location.protocol === 'http:' ? 'ws' : 'wss'}://${
        process.env.NODE_ENV === 'production'
          ? window.location.host
          : `${window.location.hostname}:${settings.WEBSOCKET_PORT}`
      }`,
      onOpen: () => {
        onSocketOpenCallbacks.forEach((cb) => cb())
        wsClient.getConnection().addEventListener('close', () => {
          onSocketCloseCallbacks.forEach((cb) => cb())
        })
      },
      retryDelayMs: () => 1000,
    })
  if (process.env.NODE_ENV !== 'production') {
    global.wsClient = wsClient
  }
  return wsClient
}

/* Links */
function getTerminalLink() {
  const httpURL =
    process.env.NODE_ENV === 'production'
      ? ''
      : `http://localhost:${process.env.PORT ?? 3000}`
  if (typeof window === 'undefined') {
    return httpBatchLink({
      url: `${httpURL}/api/trpc`, // Dummy URL
    })
  }

  const client = getWSClient()

  return wsLink<AppRouter>({
    client,
  })
}

const authLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        // Detect login mutation, redirect to index if success
        next(value) {
          if (
            op.type === 'mutation' &&
            op.path === 'user.login' &&
            value.result.type === 'data'
          ) {
            const cookie = generateCookie(
              (value.result.data as { token: string }).token,
            )
            document.cookie = cookie
            window.location.href = '/?login'
          }
          observer.next(value)
        },
        error(err) {
          observer.error(err)
        },
        complete() {
          observer.complete()
        },
      })
      return unsubscribe
    })
  }
}

/* TRPC */
const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (opts) =>
            (process.env.NODE_ENV !== 'production' &&
              typeof window !== 'undefined') ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        authLink,
        getTerminalLink(),
      ],
      transformer: superjson,
      queryClientConfig: {
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      },
    }
  },

  ssr: false,
})

export default trpc
