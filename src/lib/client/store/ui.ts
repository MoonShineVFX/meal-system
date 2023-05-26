import { StateCreator } from 'zustand'

import type { StoreState } from './define'

export interface UISlice {
  formMenuCreateSupplier: boolean
  setFormMenuCreateSupplier: (isSupplier: boolean) => void
}

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (
  set,
) => ({
  formMenuCreateSupplier: false,
  setFormMenuCreateSupplier: (isSupplier: boolean) => {
    set({ formMenuCreateSupplier: isSupplier })
  },
})
