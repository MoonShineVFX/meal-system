import { z } from 'zod'

import { userProcedure, router } from '../trpc'
import {
  createTwmpDeposit,
  getTwmpDeposit,
} from '@/lib/server/database'

export const TwmpRouter = router({
  createDeposit: userProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        isMobile: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await createTwmpDeposit(
        ctx.userLite.id,
        input.amount,
        input.isMobile ? ctx.host : undefined,
      )
    }),
  getDeposit: userProcedure
    .input(
      z.object({
        twmpDepositId: z.string().cuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const twmpDeposit = await getTwmpDeposit(input.twmpDepositId)

      if (twmpDeposit && twmpDeposit.userId !== ctx.userLite.id) {
        throw new Error('Unauthorized')
      }
      return twmpDeposit
    }),
})
