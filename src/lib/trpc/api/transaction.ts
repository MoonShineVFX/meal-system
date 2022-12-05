import { UserRole } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { observable } from '@trpc/server/observable'

import {
  rechargeUserBalance,
  chargeUserBalance,
  readTransactions,
} from '@/lib/server/database'
import {
  settings,
  validateRole,
  TransactionWithName,
  CurrencyType,
} from '@/lib/common'
import { eventEmitter, Event } from '@/lib/server/event'

import { adminProcedure, userProcedure, router } from '../trpc'

export const TransactionRouter = router({
  recharge: adminProcedure
    .input(
      z.object({
        targetUserId: z.string().min(1),
        amount: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Recharge target user
      const result = await rechargeUserBalance(
        input.targetUserId,
        input.amount,
        CurrencyType.CREDIT,
      )

      const { user, transaction } = result

      eventEmitter.emit(Event.USER_UPDATE(user.id), user)
      eventEmitter.emit(
        Event.TRANSACTION_ADD_USER(ctx.userLite.id),
        transaction,
      )
      eventEmitter.emit(Event.TRANSACTION_ADD_ADMIN, transaction)
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

      const { user, transaction } = result

      eventEmitter.emit(Event.USER_UPDATE(user.id), user)
      eventEmitter.emit(
        Event.TRANSACTION_ADD_USER(ctx.userLite.id),
        transaction,
      )
      eventEmitter.emit(Event.TRANSACTION_ADD_STAFF, transaction)
      eventEmitter.emit(Event.TRANSACTION_ADD_ADMIN, transaction)
    }),
  // Get transaction records, use until arg to update new records
  list: userProcedure
    .input(
      z.object({
        cursor: z.number().int().positive().optional(),
        role: z.enum([UserRole.USER, UserRole.STAFF, UserRole.ADMIN]),
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
      const transactions = await readTransactions(
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
  onAdd: userProcedure
    .input(
      z.object({
        role: z.enum([UserRole.USER, UserRole.STAFF, UserRole.ADMIN]),
      }),
    )
    .subscription(({ ctx, input }) => {
      // Validate role
      if (!validateRole(ctx.userLite.role, input.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This user are not allowed to access this resource',
        })
      }

      return observable<TransactionWithName>((observer) => {
        const listener = (data: TransactionWithName) => observer.next(data)
        let eventName: string

        if (input.role === UserRole.USER) {
          eventName = Event.TRANSACTION_ADD_USER(ctx.userLite.id)
        } else if (input.role === UserRole.STAFF) {
          eventName = Event.TRANSACTION_ADD_STAFF
        } else if (input.role === UserRole.ADMIN) {
          eventName = Event.TRANSACTION_ADD_ADMIN
        } else {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Invalid role',
          })
        }

        eventEmitter.on(eventName, listener)
        return () => {
          eventEmitter.off(eventName, listener)
        }
      })
    }),
})
