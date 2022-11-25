import { Role } from '@prisma/client'
import { useState, useEffect } from 'react'

import { useStore, NotificationType } from '@/lib/client/store'
import trpc, {
  onSocketOpenCallbacks,
  onSocketCloseCallbacks,
} from '@/lib/client/trpc'
import { validateRole, TransactionWithName, settings } from '@/lib/common'

function makePaymentString(transaction: TransactionWithName) {
  const actionString = settings.TRANSACTION_NAME[transaction.type]
  let paymentStrings: string[] = []
  if (transaction.creditAmount > 0) {
    paymentStrings.push(`${transaction.creditAmount} 元`)
  }
  if (transaction.pointAmount > 0) {
    paymentStrings.push(`${transaction.pointAmount} 點`)
  }

  return `${actionString} ${paymentStrings.join(' 和 ')}`
}

export default function EventListener() {
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(true)
  const [isSocketBeenClosed, setIsSocketBeenClosed] = useState(false)
  const trpcContext = trpc.useContext()
  const user = useStore((state) => state.user)
  const setUser = useStore((state) => state.setUser)
  const addNotification = useStore((state) => state.addNotification)
  const addTransactions = useStore((state) => state.addTransactions)

  const handleError = async (error: Omit<Error, 'name'>) => {
    // Catch socket closed error
    if (error.message === 'WebSocket closed prematurely') {
      return
    }
    addNotification({
      type: NotificationType.ERROR,
      message: error.message,
    })
  }

  /* Socket management */
  useEffect(() => {
    const handleSocketOpen = async () => {
      console.warn('Socket reopened, restore subscriptions')
      setSubscriptionsEnabled(true)
      addNotification({
        type: NotificationType.INFO,
        message: '恢復連線',
      })
    }
    const handleSocketClose = async () => {
      console.warn('Socket closed, removed subscriptions')
      setIsSocketBeenClosed(true)
      setSubscriptionsEnabled(false)
      addNotification({
        type: NotificationType.ERROR,
        message: '連線中斷',
      })
    }
    onSocketCloseCallbacks.push(handleSocketClose)
    onSocketOpenCallbacks.push(handleSocketOpen)
    return () => {
      onSocketCloseCallbacks.splice(
        onSocketCloseCallbacks.indexOf(handleSocketClose),
        1,
      )
      onSocketOpenCallbacks.splice(
        onSocketOpenCallbacks.indexOf(handleSocketOpen),
        1,
      )
    }
  }, [])

  /* User Info */
  trpc.user.onUpdate.useSubscription(undefined, {
    enabled: subscriptionsEnabled,
    onStarted: async () => {
      if (isSocketBeenClosed) {
        trpcContext.user.info.invalidate()
      }
    },
    onData: async (user) => {
      setUser(user)
    },
    onError: handleError,
  })

  /* User Transactions */
  trpc.trade.onTransactionAdd.useSubscription(
    { role: Role.USER },
    {
      enabled: subscriptionsEnabled,
      onStarted: async () => {
        if (isSocketBeenClosed) {
          trpcContext.trade.listTransactions.invalidate({ role: Role.USER })
        }
      },
      onData: async (transaction) => {
        trpcContext.user.info.invalidate()
        addNotification({
          type: NotificationType.SUCCESS,
          message: `成功${makePaymentString(transaction)}`,
        })
        addTransactions(Role.USER, [transaction])
      },
      onError: handleError,
    },
  )

  /* Staff Transactions */
  if (validateRole(user!.role, Role.STAFF)) {
    trpc.trade.onTransactionAdd.useSubscription(
      { role: Role.STAFF },
      {
        enabled: subscriptionsEnabled,
        onStarted: async () => {
          if (isSocketBeenClosed) {
            trpcContext.trade.listTransactions.invalidate({ role: Role.STAFF })
          }
        },
        onData: async (transaction) => {
          addTransactions(Role.STAFF, [transaction])
          addNotification({
            type: NotificationType.SUCCESS,
            message: `${transaction.sourceUser.name} ${makePaymentString(
              transaction,
            )}`,
          })
        },
        onError: handleError,
      },
    )
  }

  /* Admin Transactions */
  if (validateRole(user!.role, Role.ADMIN)) {
    trpc.trade.onTransactionAdd.useSubscription(
      { role: Role.ADMIN },
      {
        enabled: subscriptionsEnabled,
        onStarted: async () => {
          if (isSocketBeenClosed) {
            trpcContext.trade.listTransactions.invalidate({ role: Role.ADMIN })
          }
        },
        onData: async (transaction) => {
          addTransactions(Role.ADMIN, [transaction])
        },
        onError: handleError,
      },
    )
  }

  return null
}
