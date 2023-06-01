import { StateCreator } from 'zustand'
import type { Supplier } from '@prisma/client'

import type { StoreState } from './define'

export interface UISlice {
  formMenuSupplier: Supplier | null
  formMenuCreateSupplier: boolean
  setFormMenuSupplier: (supplier: Supplier | null) => void
  setFormMenuCreateSupplier: (isSupplier: boolean) => void
}

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (
  set,
) => ({
  formMenuSupplier: null,
  formMenuCreateSupplier: false,
  setFormMenuSupplier: (supplier: Supplier | null) => {
    set({ formMenuSupplier: supplier })
  },
  setFormMenuCreateSupplier: (isSupplier: boolean) => {
    set({ formMenuCreateSupplier: isSupplier })
  },
})
