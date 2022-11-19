import { Role } from '@prisma/client'
import { useAtom } from 'jotai'

import { addNotificationAtom, NotificationType } from './Notification'
import { addTransactionListAtom } from './TransactionsList'
import trpc from '@/lib/client/trpc'
import { validateRole, TransactionWithName } from '@/lib/common'

function makePaymentString(transaction: TransactionWithName) {
  let paymentStrings: string[] = []
  if (transaction.creditsAmount > 0) {
    paymentStrings.push(`${transaction.creditsAmount} 元`)
  }
  if (transaction.pointsAmount > 0) {
    paymentStrings.push(`${transaction.pointsAmount} 點`)
  }

  return `付款 ${paymentStrings.join(' 和 ')}`
}

export default function EventListener() {
  const trpcContext = trpc.useContext()
  const userInfoQuery = trpc.user.info.useQuery(undefined)
  const [, addNotification] = useAtom(addNotificationAtom)
  const [, addTransactionList] = useAtom(addTransactionListAtom)

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
      onError: async (err) => {
        addNotification({
          type: NotificationType.ERROR,
          message: err.message,
        })
      },
    },
  )

  /* Staff Transactions */
  if (validateRole(userInfoQuery.data!.role, Role.STAFF)) {
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
        onError: async (err) => {
          addNotification({
            type: NotificationType.ERROR,
            message: err.message,
          })
        },
      },
    )
  }

  /* Admin Transactions */
  if (validateRole(userInfoQuery.data!.role, Role.ADMIN)) {
    trpc.trade.onTransactionAdd.useSubscription(
      { role: Role.ADMIN },
      {
        onData: async (transaction) => {
          addTransactionList({
            role: Role.ADMIN,
            transactions: [transaction],
          })
        },
        onError: async (err) => {
          addNotification({
            type: NotificationType.ERROR,
            message: err.message,
          })
        },
      },
    )
  }

  return null
}
