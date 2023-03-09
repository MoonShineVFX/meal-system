import { z } from 'zod'

import { userProcedure, router } from '../trpc'
import { createDeposit, deleteDeposit } from '@/lib/server/database'
import { settings } from '@/lib/common'

export const DepositRouter = router({
  create: userProcedure
    .input(
      z.object({
        amount: z
          .number()
          .int()
          .positive()
          .min(settings.DEPOSIT_MIN_AMOUNT)
          .max(settings.DEPOSIT_MAX_AMOUNT),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await createDeposit({
        userId: ctx.userLite.id,
        amount: input.amount,
      })
    }),
  delete: userProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await deleteDeposit(input.id)
    }),
})
