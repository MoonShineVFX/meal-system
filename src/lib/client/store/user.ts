import { User } from '@prisma/client'
import { StateCreator } from 'zustand'

import type { StoreState } from './define'

export interface UserSlice {
  user: User | null
  setUser: (user: User | null) => void
}

export const createUserSlice: StateCreator<StoreState, [], [], UserSlice> = (
  set,
) => ({
  user: null,
  setUser: (user) => set({ user }),
})
