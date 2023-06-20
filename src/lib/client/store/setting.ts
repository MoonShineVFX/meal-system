import { StateCreator } from 'zustand'

import type { StoreState } from './define'
import { OrderOptions } from '@/lib/common'

type PrinterAPI = {
  enabled: boolean
  url: string
}

type DepositRedirect = {
  id: string
  url: string
}

type COMOptionsMemo = Record<
  string,
  {
    expireTime: number
    options: OrderOptions
  }
>

export interface SettingSlice {
  history: string[]
  serviceWorkerRegistration: ServiceWorkerRegistration | null
  webpushEnabled_local: boolean
  printerAPI_local: PrinterAPI
  depositRedirect_local: DepositRedirect | null
  comOptionsMemo_local: COMOptionsMemo
  loginRedirect_session: string | null
  setLoginRedirect: (path: string | null) => void
  addToHistory: (path: string) => void
  setServiceWorkerRegistration: (
    registration: ServiceWorkerRegistration | null,
  ) => void
  setWebpushState: (state: boolean) => void
  setPrinterAPI: (printerAPI: PrinterAPI) => void
  setDepositRedirect: (depositRedirect: DepositRedirect | null) => void
  getCOMOptionsMemo: (id: string) => OrderOptions | null
  addCOMOptionsMemo: (id: string, options: OrderOptions) => void
}

export const createSettingSlice: StateCreator<
  StoreState,
  [],
  [],
  SettingSlice
> = (set, get) => ({
  history: [],
  serviceWorkerRegistration: null,
  webpushEnabled_local: false,
  printerAPI_local: {
    enabled: false,
    url: 'http://localhost:5000',
  },
  depositRedirect_local: null,
  comOptionsMemo_local: {},
  loginRedirect_session: null,
  setLoginRedirect: (path: string | null) => {
    set({ loginRedirect_session: path })
  },
  getCOMOptionsMemo: (id) => {
    const { comOptionsMemo_local } = get()

    set((state) => ({
      comOptionsMemo_local: Object.fromEntries(
        Object.entries(state.comOptionsMemo_local).filter(([, value]) => {
          value.expireTime > Date.now()
        }),
      ),
    }))

    if (id in comOptionsMemo_local) {
      return comOptionsMemo_local[id].options
    }

    return null
  },
  addCOMOptionsMemo: (id, options) => {
    set((state) => ({
      comOptionsMemo_local: {
        ...state.comOptionsMemo_local,
        [id]: {
          expireTime: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
          options,
        },
      },
    }))
  },
  addToHistory: (path) => {
    // shrink history to 100 items
    set((state) => ({
      history: [...state.history.slice(-99), path],
    }))
  },
  setWebpushState: (state: boolean) => {
    set({ webpushEnabled_local: state })
  },
  setServiceWorkerRegistration: (
    registration: ServiceWorkerRegistration | null,
  ) => {
    set({ serviceWorkerRegistration: registration })
  },
  setPrinterAPI: (printerAPI: PrinterAPI) => {
    set({ printerAPI_local: printerAPI })
  },
  setDepositRedirect: (depositRedirect: DepositRedirect | null) => {
    set({ depositRedirect_local: depositRedirect })
  },
})
