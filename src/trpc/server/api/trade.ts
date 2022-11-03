import { adminProcedure, userProcedure, router } from '../server'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { rechargeUserCredits, chargeUserBalance } from '@/utils/database'
import { CurrencyType } from '@prisma/client'

export const TradeRouter = router({
  recharge: adminProcedure
    .input(
      z.object({
        targetUserId: z.string().min(1),
        amount: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Recharge target user
      const result = await rechargeUserCredits(
        ctx.userLite.id,
        input.targetUserId,
        input.amount
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Charge user
      const result = await chargeUserBalance(
        ctx.userLite.id,
        input.amount,
        input.currency
      )

      if (result instanceof Error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.message,
        })
      }
    }),
})
