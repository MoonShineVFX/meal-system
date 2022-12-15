import { router } from '../trpc'
import { UserRouter } from './user'
import { TransactionRouter } from './transaction'
import { TwmpRouter } from './twmp'
import { MenuRouter } from './menu'
import { CartRouter } from './cart'

export const appRouter = router({
  user: UserRouter,
  transaction: TransactionRouter,
  twmp: TwmpRouter,
  menu: MenuRouter,
  cart: CartRouter,
})

export type AppRouter = typeof appRouter
