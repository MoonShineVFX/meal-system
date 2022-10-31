import { z } from 'zod'
import { publicProcedure, router } from '@/server/trpc'
import { UserRouter } from './user'

export const appRouter = router({
  user: UserRouter,
})

export type AppRouter = typeof appRouter
