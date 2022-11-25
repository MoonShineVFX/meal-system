import { router } from '../trpc'
import { UserRouter } from './user'
import { TransactionRouter } from './transaction'

export const appRouter = router({
  user: UserRouter,
  transaction: TransactionRouter,
})

export type AppRouter = typeof appRouter
