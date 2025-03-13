import trpc from '@/lib/client/trpc'
import { memo } from 'react'

function LiveConnections() {
  const { data } = trpc.user.getConnectedUsers.useQuery(undefined)

  return (
    <div className='flex items-center gap-2 text-sm font-medium text-stone-500'>
      <span>連線數： {data ?? '-'}</span>
    </div>
  )
}

export default memo(LiveConnections)
