import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'

import { createNotificationSlice } from './notification'
import { createUISlice } from './ui'
import { createSettingSlice } from './setting'
import type { StoreState } from './define'

const storage: StateStorage = {
  getItem: (name) => {
    const localState = localStorage.getItem(name)
    const sessionState = sessionStorage.getItem(name)
    const localData = localState ? JSON.parse(localState) : {}
    const sessionData = sessionState ? JSON.parse(sessionState) : {}
    return JSON.stringify({
      state: { ...localData.state, ...sessionData.state },
      version: localData.version,
    })
  },
  setItem: (name, value) => {
    const { state, version } = JSON.parse(value)
    const localData = Object.fromEntries(
      Object.entries(state).filter(([key]) => key.endsWith('_local')),
    )
    const sessionData = Object.fromEntries(
      Object.entries(state).filter(([key]) => key.endsWith('_session')),
    )
    localStorage.setItem(name, JSON.stringify({ state: localData, version }))
    sessionStorage.setItem(
      name,
      JSON.stringify({ state: sessionData, version }),
    )
  },
  removeItem: (name) => {
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createNotificationSlice(...a),
      ...createUISlice(...a),
      ...createSettingSlice(...a),
    }),
    {
      name: 'ms-cafe-zustand',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        printerAPI_local: state.printerAPI_local,
        depositRedirect_local: state.depositRedirect_local,
        comOptionsMemo_local: state.comOptionsMemo_local,
        loginRedirect_session: state.loginRedirect_session,
        unavailableConfirms_local: state.unavailableConfirms_local,
        reservationsScrollPosition_session:
          state.reservationsScrollPosition_session,
        transactionListScrollPosition_session:
          state.transactionListScrollPosition_session,
        qrcodeAutoCheckout_local: state.qrcodeAutoCheckout_local,
        posNotificationSound_local: state.posNotificationSound_local,
      }),
    },
  ),
)

export { NotificationType } from './notification'
export type { NotificationPayload } from './notification'
