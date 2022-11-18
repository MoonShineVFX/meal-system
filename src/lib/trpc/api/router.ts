import { router } from '../trpc'
import { UserRouter } from './user'
import { TradeRouter } from './trade'

export const appRouter = router({
  user: UserRouter,
  trade: TradeRouter,
})

export type AppRouter = typeof appRouter