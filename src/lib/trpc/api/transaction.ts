import { z } from 'zod'

import {
  rechargeUserBalance,
  getTransaction,
  getTransactions,
} from '@/lib/server/database'
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
        keyword: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const transactions = await getTransactions({
        userId: ctx.userLite.id,
        cursor: input.cursor,
        keyword: input.keyword ? input.keyword.trim() : undefined,
      })

      let nextCursor: number | undefined = undefined
      if (transactions.length > settings.TRANSACTIONS_PER_QUERY) {
        nextCursor = transactions.pop()!.id
      }
      return {
        transactions,
        nextCursor,
      }
    }),
  getDetail: userProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const transaction = await getTransaction({ transactionId: input.id })

      if (
        transaction.sourceUserId !== ctx.userLite.id &&
        transaction.targetUserId !== ctx.userLite.id
      ) {
        throw new Error('Unauthorized')
      }

      return transaction
    }),
})
