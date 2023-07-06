import { StateCreator } from 'zustand'
import type { Supplier } from '@prisma/client'

import type { StoreState } from './define'
import type { MenuData } from '@/lib/client/trpc'

type DialogButtonState = 'loading' | 'disabled' | 'null' | 'success'

export interface UISlice {
  currentMenu: MenuData | null
  currentCategory: string | null
  formMenuSupplier: Supplier | null
  formMenuCreateSupplier: boolean
  dialogButtonState: DialogButtonState
  loginSuccessNotify_session: boolean
  unavailableConfirms_session: Record<string, boolean>
  reservationsScrollPosition_session: number
  transactionListScrollPosition_session: number
  setLoginSuccessNotify: (state: boolean) => void
  setCurrentMenu: (menu: MenuData | null) => void
  setCurrentCategory: (category: string | null) => void
  setFormMenuSupplier: (supplier: Supplier | null) => void
  setFormMenuCreateSupplier: (isSupplier: boolean) => void
  setDialogButtonState: (state: DialogButtonState) => void
  addUnavailableConfirm: (id: string) => void
  setReservationsScrollPosition: (position: number) => void
  setTransactionListScrollPosition: (position: number) => void
}

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (
  set,
) => ({
  currentMenu: null,
  currentCategory: null,
  formMenuSupplier: null,
  formMenuCreateSupplier: false,
  dialogButtonState: 'null',
  loginSuccessNotify_session: false,
  unavailableConfirms_session: {},
  reservationsScrollPosition_session: 0,
  transactionListScrollPosition_session: 0,
  setLoginSuccessNotify: (state: boolean) => {
    set({ loginSuccessNotify_session: state })
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
  setCurrentMenu: (menu) => set({ currentMenu: menu }),
  setCurrentCategory: (category) => set({ currentCategory: category }),
  addUnavailableConfirm: (id) => {
    set((state) => ({
      unavailableConfirms_session: {
        ...state.unavailableConfirms_session,
        [id]: true,
      },
    }))
  },
  setReservationsScrollPosition: (position) => {
    set({ reservationsScrollPosition_session: position })
  },
  setTransactionListScrollPosition: (position) => {
    set({ transactionListScrollPosition_session: position })
  },
})
