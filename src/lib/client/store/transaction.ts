import { StateCreator } from 'zustand'
import { UserRole } from '@prisma/client'

import type { TransactionWithNames } from '@/lib/client/trpc'
import type { StoreState } from './define'

export interface TransactionSlice {
  [UserRole.USER]: TransactionWithNames[]
  [UserRole.STAFF]: TransactionWithNames[]
  [UserRole.ADMIN]: TransactionWithNames[]
  addTransactions: (
    role: Exclude<UserRole, 'SERVER'>,
    transactions: TransactionWithNames[],
  ) => void
}

export const createTransactionSlice: StateCreator<
  StoreState,
  [],
  [],
  TransactionSlice
> = (set) => ({
  [UserRole.USER]: [],
  [UserRole.STAFF]: [],
  [UserRole.ADMIN]: [],
  addTransactions: async (role, transactions) => {
    set((state) => {
      const prevTransactions = state[role]
      const transactionsMap: Record<
        TransactionWithNames['id'],
        TransactionWithNames
      > = {}

      for (const transaction of prevTransactions) {
        transactionsMap[transaction.id] = transaction
      }

      for (const transaction of transactions) {
        transactionsMap[transaction.id] = transaction
      }

      return {
        [role]: Object.values(transactionsMap).sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        ),
      }
    })
  },
})
