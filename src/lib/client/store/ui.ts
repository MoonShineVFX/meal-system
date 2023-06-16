import { StateCreator } from 'zustand'
import type { Supplier } from '@prisma/client'

import type { StoreState } from './define'

type DialogButtonState = 'loading' | 'disabled' | 'null' | 'success'

export interface UISlice {
  serviceWorkerRegistration: ServiceWorkerRegistration | null
  formMenuSupplier: Supplier | null
  formMenuCreateSupplier: boolean
  dialogButtonState: DialogButtonState
  setServiceWorkerRegistration: (
    registration: ServiceWorkerRegistration | null,
  ) => void
  setFormMenuSupplier: (supplier: Supplier | null) => void
  setFormMenuCreateSupplier: (isSupplier: boolean) => void
  setDialogButtonState: (state: DialogButtonState) => void
}

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (
  set,
) => ({
  serviceWorkerRegistration: null,
  formMenuSupplier: null,
  formMenuCreateSupplier: false,
  dialogButtonState: 'null',
  setServiceWorkerRegistration: (
    registration: ServiceWorkerRegistration | null,
  ) => {
    set({ serviceWorkerRegistration: registration })
  },
  setFormMenuSupplier: (supplier: Supplier | null) => {
    set({ formMenuSupplier: supplier })
  },
  setFormMenuCreateSupplier: (isSupplier: boolean) => {
    set({ formMenuCreateSupplier: isSupplier })
  },
  setDialogButtonState: (state: DialogButtonState) => {
    set({ dialogButtonState: state })
  },
})
