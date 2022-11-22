import { StateCreator } from 'zustand'
import { Role } from '@prisma/client'

import { TransactionWithName } from '@/lib/common'
import type { StoreState } from './define'

export interface TransactionSlice {
  [Role.USER]: TransactionWithName[]
  [Role.STAFF]: TransactionWithName[]
  [Role.ADMIN]: TransactionWithName[]
  addTransactions: (
    role: Exclude<Role, 'SERVER'>,
    transactions: TransactionWithName[],
  ) => void
}

export const createTransactionSlice: StateCreator<
  StoreState,
  [],
  [],
  TransactionSlice
> = (set) => ({
  [Role.USER]: [],
  [Role.STAFF]: [],
  [Role.ADMIN]: [],
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
