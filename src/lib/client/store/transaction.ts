import { StateCreator } from 'zustand'
import { UserRole } from '@prisma/client'

import { TransactionWithName } from '@/lib/common'
import type { StoreState } from './define'

export interface TransactionSlice {
  [UserRole.USER]: TransactionWithName[]
  [UserRole.STAFF]: TransactionWithName[]
  [UserRole.ADMIN]: TransactionWithName[]
  addTransactions: (
    role: Exclude<UserRole, 'SERVER'>,
    transactions: TransactionWithName[],
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
        TransactionWithName['id'],
        TransactionWithName
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
