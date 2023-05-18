import { z } from 'zod'

import { getTransaction, getTransactions } from '@/lib/server/database'
import { settings } from '@/lib/common'

import { userProcedure, staffProcedure, router } from '../trpc'

export const TransactionRouter = router({
  // Get transaction records, use until arg to update new records
  get: userProcedure
    .input(
      z.object({
        cursor: z.number().int().positive().optional(),
        keyword: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await await getTransactionsWithCursor({
        userId: ctx.userLite.id,
        cursor: input.cursor,
        keyword: input.keyword ? input.keyword.trim() : undefined,
      })
    }),
  getList: staffProcedure
    .input(
      z.object({
        cursor: z.number().int().positive().optional(),
        keyword: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await getTransactionsWithCursor({
        cursor: input.cursor,
        keyword: input.keyword ? input.keyword.trim() : undefined,
      })
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

async function getTransactionsWithCursor(
  props: Parameters<typeof getTransactions>[0],
) {
  const transactions = await getTransactions(props)

  let nextCursor: number | undefined = undefined
  if (transactions.length > settings.TRANSACTIONS_PER_QUERY) {
    nextCursor = transactions.pop()!.id
  }
  return {
    transactions,
    nextCursor,
  }
}
