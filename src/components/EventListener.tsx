import trpc from '@/trpc/client/client'
import { Role } from '@prisma/client'
import { useState } from 'react'

export default function EventListener() {
  const trpcContext = trpc.useContext()
  const [eventDate, setEventDate] = useState(new Date())
  const userInfoQuery = trpc.user.info.useQuery(undefined)

  const updateTranscations = async (role: Role) => {
    const data = trpcContext.trade.listTransactions.getInfiniteData({ role })
    if (
      !data ||
      data.pages.length === 0 ||
      data.pages[0].transactions.length === 0
    )
      return

    const { transactions: newTransactions } =
      await trpcContext.trade.listTransactions.fetch({
        until: data.pages[0].transactions[0].id,
        role,
      })
    trpcContext.trade.listTransactions.setInfiniteData(
      (data) => {
        return {
          pages: data!.pages.map((page, i) => {
            if (i !== 0) return page
            return {
              transactions: [...newTransactions, ...page.transactions],
              nextCursor: page.nextCursor,
            }
          }),
          pageParams: data!.pageParams,
        }
      },
      { role },
    )
  }

  // Polling for new events
  trpc.events.useQuery(
    { eventDate: eventDate },
    {
      enabled: userInfoQuery.isSuccess,
      refetchInterval: 1000,
      onSuccess: async (data) => {
        if (data.length === 0) return

        /* Handle events */
        // revalidate userinfo
        trpcContext.user.info.invalidate()
        // update transcations
        for (const role of Object.keys(Role)) {
          updateTranscations(role as Role)
        }

        // set event date to latest
        setEventDate(data[data.length - 1].date)
      },
    },
  )
  return null
}
