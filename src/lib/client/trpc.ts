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
import type { UseTRPCMutationResult } from '@trpc/react-query/shared'

import { generateCookie, settings } from '@/lib/common'
import type { AppRouter } from '@/lib/trpc'
import { useStore } from './store'

export const onSocketOpenCallbacks: (() => void)[] = []
export const onSocketCloseCallbacks: (() => void)[] = []
export const onQueryMutationErrorCallbacks: ((error: Error) => void)[] = []

/* Types */
type RouterOutput = inferRouterOutputs<AppRouter>
export type UseMutationResult = UseTRPCMutationResult<any, any, any, any>

export type UserInfo = RouterOutput['user']['get']
export type MenuData = RouterOutput['menu']['get']
export type MenuActiveDatas = RouterOutput['menu']['getActives']
export type CommoditiesOnMenu = MenuData['commodities']
export type CommodityOnMenu = CommoditiesOnMenu[0]
export type CommoditiesOnMenuByCategory = Map<
  string,
  {
    order: number
    subCategories: Map<
      string,
      { order: number; coms: (CommodityOnMenu | undefined)[] }
    >
  }
>
export type CartData = RouterOutput['cart']['get']
export type InvalidCartItems = CartData['invalidCartItems']
export type CartItems = CartData['cartItems']
export type CartItemsByMenu = Map<
  number,
  CartData['cartItems'][0]['commodityOnMenu']['menu'] & { cartItems: CartItems }
>
export type CartItemsAndMenus = (
  | CartItems[0]
  | (CartData['cartItems'][0]['commodityOnMenu']['menu'] & { id: number })
)[]
export type OrderDatas = RouterOutput['order']['get']['orders']
export type OrderItems = OrderDatas[0]['items']
export type POSLiveDatas = RouterOutput['pos']['getLive']
export type POSReservationDatas = RouterOutput['pos']['getReservation']
export type ReservationDatas = RouterOutput['menu']['getReservationsForUser']
export type TransactionDatas =
  RouterOutput['transaction']['getListByUser']['transactions']
export type CategoryDatas = RouterOutput['category']['get']
export type CommodityDatas = RouterOutput['commodity']['getList']
export type OptionSetsTemplateDatas = RouterOutput['optionSet']['get']
export type DepositData = RouterOutput['deposit']['get']
export type DepositDatas = RouterOutput['deposit']['getList']['deposits']
export type SupplierDatas = RouterOutput['supplier']['getList']
export type BonusDatas = RouterOutput['bonus']['getList']['bonus']

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
          ? settings.WEBSOCKET_PROD_HOST ?? `wss://${window.location.host}`
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
            // On login success, set cookie and notify
            const cookie = generateCookie(
              (value.result.data as { token: string }).token,
            )
            useStore.setState({ loginSuccessNotify_session: true })
            document.cookie = cookie

            const loginRedirect = useStore.getState().loginRedirect_session
            if (loginRedirect !== null) {
              useStore.setState({ loginRedirect_session: null })
            }

            window.location.href =
              loginRedirect === null ? '/live' : loginRedirect
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
            process.env.NODE_ENV !== 'production' ||
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
            // refetchOnMount: false,
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
