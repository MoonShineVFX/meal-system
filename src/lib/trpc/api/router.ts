import { router } from '../trpc'
import { UserRouter } from './user'
import { TransactionRouter } from './transaction'
import { TwmpRouter } from './twmp'
import { MenuRouter } from './menu'
import { CartRouter } from './cart'
import { OrderRouter } from './order'

export const appRouter = router({
  user: UserRouter,
  transaction: TransactionRouter,
  twmp: TwmpRouter,
  menu: MenuRouter,
  cart: CartRouter,
  order: OrderRouter,
})

export type AppRouter = typeof appRouter
