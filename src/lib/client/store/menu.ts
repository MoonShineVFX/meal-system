import { StateCreator } from 'zustand'

import type { StoreState } from './define'

export interface MenuSlice {
  menuUnavailableMessage: string | null
  setMenuUnavailableMessage: (menuUnavailableMessage: string | null) => void
}

export const createMenuSlice: StateCreator<StoreState, [], [], MenuSlice> = (
  set,
) => ({
  menuUnavailableMessage: null,
  setMenuUnavailableMessage: (menuUnavailableMessage) =>
    set({ menuUnavailableMessage }),
})
