import { StateCreator } from 'zustand'

import type { StoreState } from './define'
import type { Menu } from '@/lib/client/trpc'

export interface MenuSlice {
  currentMenu: Menu | null
  currentCategory: string | null
  setCurrentMenu: (menu: Menu | null) => void
  setCurrentCategory: (category: string | null) => void
}

export const createMenuSlice: StateCreator<StoreState, [], [], MenuSlice> = (
  set,
) => ({
  currentMenu: null,
  currentCategory: null,
  setCurrentMenu: (menu) => set({ currentMenu: menu }),
  setCurrentCategory: (category) => set({ currentCategory: category }),
})
