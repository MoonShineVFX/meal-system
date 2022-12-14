import { authProcedure, router } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { rechargeCredits } from '@/utils/database'

export const TradeRouter = router({
  recharge: authProcedure
    .input(
      z.object({
        targetUserId: z.string().min(1),
        amount: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Asset admin only
      if (ctx.userLite.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Only admin can charge',
        })
      }

      // Recharge target user
      const result = await rechargeCredits(
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
})
