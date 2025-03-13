import { httpBatchLink, loggerLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import type { UseTRPCMutationResult } from '@trpc/react-query/shared'
import type { inferRouterOutputs } from '@trpc/server'
import superjson from 'superjson'

import type { AppRouter } from '@/lib/trpc'

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
        httpBatchLink({
          url: `/api/trpc`,
          transformer: superjson,
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            retry: false,
          },
          mutations: {
            retry: false,
          },
        },
      },
    }
  },
  transformer: superjson,
  ssr: false,
})

export default trpc
