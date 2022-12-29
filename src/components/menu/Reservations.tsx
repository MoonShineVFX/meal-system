import trpc from '@/lib/client/trpc'
import Error from '@/components/core/Error'

export default function Reservations() {
  const { data, isLoading, isError, error } =
    trpc.menu.getReservations.useQuery()

  if (isLoading) return <div>Loading...</div>
  if (isError) return <Error description={error.message} />

  return (
    <div className='h-full w-full'>
      <div className='flex flex-col'>{}</div>
    </div>
  )
}
