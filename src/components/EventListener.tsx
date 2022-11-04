import trpc from '@/trpc/client/client'
import { useState } from 'react'

export default function EventListener() {
  const trpcContext = trpc.useContext()
  const [eventDate, setEventDate] = useState(new Date())
  const userInfoQuery = trpc.user.info.useQuery(undefined)

  trpc.events.useQuery(
    { eventDate: eventDate },
    {
      enabled: userInfoQuery.isSuccess,
      refetchInterval: 1000,
      onSuccess: async (data) => {
        if (data.length === 0) return

        // deal events, just revalidate userinfo temporarily
        trpcContext.user.info.invalidate()

        // set event date to latest
        setEventDate(data[data.length - 1].date)
      },
    }
  )
  return null
}
