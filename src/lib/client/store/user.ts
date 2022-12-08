import { StateCreator } from 'zustand'

import type { UserInfo } from '@/lib/client/trpc'
import type { StoreState } from './define'

export interface UserSlice {
  user: UserInfo | null
  setUser: (user: UserInfo | null) => void
}

export const createUserSlice: StateCreator<StoreState, [], [], UserSlice> = (
  set,
) => ({
  user: null,
  setUser: (user) => set({ user }),
})
