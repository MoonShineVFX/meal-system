import { UserRole } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import {
  rechargeUserBalance,
  chargeUserBalance,
  getTransactions,
} from '@/lib/server/database'
import { settings, validateRole, CurrencyType } from '@/lib/common'

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
      await rechargeUserBalance(
        input.targetUserId,
        input.amount,
        CurrencyType.CREDIT,
      )
    }),
  charge: userProcedure
    .input(
      z.object({
        amount: z.number().int().positive(),
        isUsingPoint: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Charge user
      await chargeUserBalance(ctx.userLite.id, input.amount, input.isUsingPoint)
    }),
  // Get transaction records, use until arg to update new records
  getList: userProcedure
    .input(
      z.object({
        cursor: z.number().int().positive().optional(),
        role: z.nativeEnum(UserRole),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Validate role
      if (!validateRole(ctx.userLite.role, input.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This user are not allowed to access this resource',
        })
      }

      // Get transactions
      const transactions = await getTransactions(
        ctx.userLite.id,
        input.cursor,
        input.role,
      )

      let nextCursor: number | undefined = undefined
      if (transactions.length > settings.TRANSACTIONS_PER_PAGE) {
        nextCursor = transactions.pop()!.id
      }
      return {
        transactions: transactions,
        nextCursor,
      }
    }),
})
