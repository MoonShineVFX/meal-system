import { z } from 'zod'

import { eventsCentral } from '@/lib/server/event'

import { router, userProcedure } from '../trpc'
import { UserRouter } from './user'
import { TradeRouter } from './trade'

export const appRouter = router({
  user: UserRouter,
  trade: TradeRouter,
  events: userProcedure
    .input(z.object({ eventDate: z.date().optional() }))
    .query(async ({ ctx, input }) => {
      return await eventsCentral.getEvents(
        ctx.userLite.id,
        input.eventDate,
        ctx.userLite.role,
      )
    }),
})

export type AppRouter = typeof appRouter
