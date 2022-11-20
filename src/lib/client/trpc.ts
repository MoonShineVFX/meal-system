import {
  loggerLink,
  createWSClient,
  wsLink,
  TRPCLink,
  httpBatchLink,
} from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import superjson from 'superjson'
import { observable } from '@trpc/server/observable'

import { generateCookie, settings } from '@/lib/common'
import type { AppRouter } from '@/lib/trpc'

function getTerminalLink() {
  const httpURL =
    process.env.NODE_ENV === 'production'
      ? ''
      : `http://localhost:${process.env.PORT ?? 3000}`
  if (typeof window === 'undefined') {
    return httpBatchLink({
      url: `${httpURL}/api/trpc`,
    })
  }

  const client = createWSClient({
    url: `${window.location.protocol === 'http:' ? 'ws' : 'wss'}://${
      process.env.NODE_ENV === 'production'
        ? ''
        : `${window.location.hostname}:${settings.WEBSOCKET_PORT}`
    }`,

    onClose: () => {
      console.error(
        'Websocket closed, reload page to resubscribe to events due to bug in trpc',
      )
      if (
        typeof window !== 'undefined' &&
        process.env.NODE_ENV === 'production'
      ) {
        window.location.reload()
      }
    },
  })

  return wsLink<AppRouter>({
    client,
  })
}

const authLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
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
            window.location.href = '/'
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
