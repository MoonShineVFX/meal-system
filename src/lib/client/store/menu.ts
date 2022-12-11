import { StateCreator } from 'zustand'

import type { StoreState } from './define'
import type { Menu } from '@/lib/client/trpc'

export interface MenuSlice {
  currentMenu: Menu | null
  setCurrentMenu: (menu: Menu | null) => void
}

export const createMenuSlice: StateCreator<StoreState, [], [], MenuSlice> = (
  set,
) => ({
  currentMenu: null,
  setCurrentMenu: (menu) => set({ currentMenu: menu }),
})
