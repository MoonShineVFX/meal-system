import trpc from '@/trpc/client/client'
import { Role } from '@prisma/client'
import { useState } from 'react'

export default function EventListener() {
  const trpcContext = trpc.useContext()
  const [eventDate, setEventDate] = useState(new Date())
  const userInfoQuery = trpc.user.info.useQuery(undefined)

  const updateUserRecords = async () => {
    const data = trpcContext.trade.listTransactions.getInfiniteData({
      role: Role.USER,
    })
    if (!data || data.pages.length === 0 || data.pages[0].records.length === 0)
      return

    const { records: newRecords } =
      await trpcContext.trade.listTransactions.fetch({
        until: data.pages[0].records[0].id,
        role: Role.USER,
      })
    trpcContext.trade.listTransactions.setInfiniteData(
      (data) => {
        return {
          pages: data!.pages.map((page, i) => {
            if (i !== 0) return page
            return {
              records: [...newRecords, ...page.records],
              nextCursor: page.nextCursor,
            }
          }),
          pageParams: data!.pageParams,
        }
      },
      { role: Role.USER }
    )
  }

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
        // update records
        updateUserRecords()

        // set event date to latest
        setEventDate(data[data.length - 1].date)
      },
    }
  )
  return null
}
