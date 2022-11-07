import { adminProcedure, userProcedure, router } from '../server'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import {
  rechargeUserCredits,
  chargeUserBalance,
  getTransactions,
} from '@/utils/database'
import { CurrencyType, Role } from '@prisma/client'
import { settings } from '@/utils/settings'

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
        currency: z.enum([CurrencyType.CREDIT, CurrencyType.POINT]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Charge user
      const result = await chargeUserBalance(
        ctx.userLite.id,
        input.amount,
        input.currency,
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
        until: z.number().int().positive().optional(),
        role: z.enum([Role.USER, Role.STAFF, Role.ADMIN, Role.SERVER]),
      }),
    )
    .query(async ({ input, ctx }) => {
      const transactions = await getTransactions(
        ctx.userLite.id,
        input.cursor,
        input.until,
        input.role,
      )
      let nextCursor: number | undefined = undefined
      if (!input.until && transactions.length > settings.RECORDS_PER_PAGE) {
        nextCursor = transactions.pop()!.id
      }
      return {
        transactions: transactions,
        nextCursor,
      }
    }),
})
