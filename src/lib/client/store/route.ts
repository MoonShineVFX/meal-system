import { StateCreator } from 'zustand'

import type { StoreState } from './define'

export interface RouteSlice {
  history: string[]
  addToHistory: (path: string) => void
}

export const createRouteSlice: StateCreator<StoreState, [], [], RouteSlice> = (
  set,
) => ({
  history: [],
  addToHistory: (path) => {
    // shrink history to 100 items
    set((state) => ({
      history: [...state.history.slice(-99), path],
    }))
  },
})
