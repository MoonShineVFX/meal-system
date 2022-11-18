import { Role } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import {
  rechargeUserCredits,
  chargeUserBalance,
  getTransactions,
} from '@/lib/server/database'
import { settings, validateRole } from '@/lib/common'

import { adminProcedure, userProcedure, router } from '../trpc'

export const TradeRouter = router({
  recharge: adminProcedure
    .input(
      z.object({
        targetUserId: z.string().min(1),
        amount: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Recharge target user
      const result = await rechargeUserCredits(
        ctx.userLite.id,
        input.targetUserId,
        input.amount,
      )

      if (result instanceof Error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.message,
        })
      }
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
      const result = await chargeUserBalance(
        ctx.userLite.id,
        input.amount,
        input.isUsingPoint,
      )

      if (result instanceof Error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.message,
        })
      }
    }),
  // Get transaction records, use until arg to update new records
  listTransactions: userProcedure
    .input(
      z.object({
        cursor: z.number().int().positive().optional(),
        role: z.enum([Role.USER, Role.STAFF, Role.ADMIN, Role.SERVER]),
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
