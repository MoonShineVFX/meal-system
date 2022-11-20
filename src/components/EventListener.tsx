import { Role } from '@prisma/client'
import { useSetAtom, useAtom } from 'jotai'

import { addNotificationAtom, NotificationType } from './Notification'
import { addTransactionListAtom } from './TransactionsList'
import trpc from '@/lib/client/trpc'
import { validateRole, TransactionWithName, settings } from '@/lib/common'
import { userAtom } from './AuthValidator'

function makePaymentString(transaction: TransactionWithName) {
  const actionString = settings.TRANSACTION_NAME[transaction.type]
  let paymentStrings: string[] = []
  if (transaction.creditsAmount > 0) {
    paymentStrings.push(`${transaction.creditsAmount} 元`)
  }
  if (transaction.pointsAmount > 0) {
    paymentStrings.push(`${transaction.pointsAmount} 點`)
  }

  return `${actionString} ${paymentStrings.join(' 和 ')}`
}

export default function EventListener() {
  const trpcContext = trpc.useContext()
  const [user, setUser] = useAtom(userAtom)
  const addNotification = useSetAtom(addNotificationAtom)
  const addTransactionList = useSetAtom(addTransactionListAtom)

  const handleError = async (error: Omit<Error, 'name'>) => {
    addNotification({
      type: NotificationType.ERROR,
      message: error.message,
    })
  }

  /* User Info */
  trpc.user.onUpdate.useSubscription(undefined, {
    onData(user) {
      setUser(user)
    },
    onError: handleError,
  })

  /* User Transactions */
  trpc.trade.onTransactionAdd.useSubscription(
    { role: Role.USER },
    {
      onData: async (transaction) => {
        trpcContext.user.info.invalidate()
        addNotification({
          type: NotificationType.SUCCESS,
          message: `成功${makePaymentString(transaction)}`,
        })
        addTransactionList({ role: Role.USER, transactions: [transaction] })
      },
      onError: handleError,
    },
  )

  /* Staff Transactions */
  if (validateRole(user!.role, Role.STAFF)) {
    trpc.trade.onTransactionAdd.useSubscription(
      { role: Role.STAFF },
      {
        onData: async (transaction) => {
          addTransactionList({
            role: Role.STAFF,
            transactions: [transaction],
          })
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
        onData: async (transaction) => {
          addTransactionList({
            role: Role.ADMIN,
            transactions: [transaction],
          })
        },
        onError: handleError,
      },
    )
  }

  return null
}
