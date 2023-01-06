import { z } from 'zod'

import { rechargeUserBalance, getTransactions } from '@/lib/server/database'
import { settings } from '@/lib/common'

import { adminProcedure, userProcedure, router } from '../trpc'

export const TransactionRouter = router({
  recharge: adminProcedure
    .input(
      z.object({
        targetUserId: z.string().min(1),
        amount: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input }) => {
      // Recharge target user
      await rechargeUserBalance({
        userId: input.targetUserId,
        creditAmount: input.amount,
      })
    }),
  // Get transaction records, use until arg to update new records
  get: userProcedure
    .input(
      z.object({
        cursor: z.number().int().positive().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const transactions = await getTransactions(ctx.userLite.id, input.cursor)

      let nextCursor: number | undefined = undefined
      if (transactions.length > settings.TRANSACTIONS_PER_QUERY) {
        nextCursor = transactions.pop()!.id
      }
      return {
        transactions,
        nextCursor,
      }
    }),
})
