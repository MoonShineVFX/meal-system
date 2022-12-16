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
export const onQueryMutationErrorCallbacks: ((error: Error) => void)[] = []

/* Types */
type RouterOutput = inferRouterOutputs<AppRouter>

export type UserInfo = RouterOutput['user']['get']

export type TransactionWithNames =
  RouterOutput['transaction']['getList']['transactions'][0]

export type Menu = RouterOutput['menu']['get']
export type CommoditiesOnMenu = Menu['commodities']
export type CommodityOnMenu = CommoditiesOnMenu[0]
export type CommoditiesOnMenuByCategory = Map<
  string,
  Map<string, (CommodityOnMenu | undefined)[]>
>
export type CartData = RouterOutput['cart']['get']
export type InvalidCartItems = CartData['invalidCartItems']
export type CartItems = CartData['cartItems']
export type CartItemsByMenu = Map<
  number,
  CartData['cartItems'][0]['commodityOnMenu']['menu'] & { cartItems: CartItems }
>

/* WebSocket Client */
declare global {
  var wsClient: ReturnType<typeof createWSClient> | undefined
}
function getWSClient() {
  const wsClient =
    global.wsClient ??
    createWSClient({
      url:
        process.env.NODE_ENV === 'production'
          ? `wss://${window.location.host}`
          : `ws://${window.location.hostname}:${settings.WEBSOCKET_DEV_PORT}`,
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
        next(value) {
          // Detect login mutation, redirect to index if success
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
          onQueryMutationErrorCallbacks.forEach((cb) => cb(err))
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
