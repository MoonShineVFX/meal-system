import { useMemo } from 'react'
import { ArchiveBoxIcon } from '@heroicons/react/24/outline'

import trpc from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import POSLiveCard from '@/components/pos/POSLiveCard'
import { twData } from '@/lib/common'

const TOTAL_FILLER_COUNT = 6

export default function POSLiveList(props: {
  tabName: '待處理' | '已出餐' | '已完成'
}) {
  const { data, isLoading, isError, error } = trpc.pos.getLive.useQuery({
    type: props.tabName === '已完成' ? 'archived' : 'live',
  })

  const filteredOrders = useMemo(() => {
    if (!data) return []

    if (props.tabName === '待處理') {
      return data
        .filter((order) => order.timeDishedUp === null)
        .sort((a, b) => {
          const aOrder = a.timeDishedUp ? 1 : 0
          const bOrder = b.timeDishedUp ? 1 : 0
          if (aOrder === bOrder) return 0
          return aOrder - bOrder
        })
    } else if (props.tabName === '已出餐') {
      return data.filter((order) => order.timeDishedUp !== null)
    } else if (props.tabName === '已完成') {
      return data
    }

    return []
  }, [data, props.tabName])

  const fillerCount = Math.max(TOTAL_FILLER_COUNT - filteredOrders.length)

  if (isError) {
    return <Error description={error.message} />
  }

  return (
    <div
      className='group h-full w-full'
      {...twData({
        loading: isLoading,
      })}
    >
      {/* Empty */}
      {filteredOrders.length === 0 && !isLoading && (
        <div className='flex h-full flex-col items-center justify-center gap-4'>
          <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
            <ArchiveBoxIcon className='h-12 w-12 text-stone-400' />
          </div>
          <h1 className='indent-[0.1em] text-lg font-bold tracking-widest text-stone-500'>{`沒有${props.tabName}的訂單`}</h1>
        </div>
      )}
      {/* Cards */}
      <div className='ms-scroll absolute inset-0 overflow-y-auto p-4 pt-[3.75rem] sm:pt-[4rem] lg:p-8'>
        <div className='grid w-full grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4 lg:gap-8'>
          {isLoading ? (
            <>
              {[...Array(6).keys()].map((index) => (
                <POSLiveCard key={`loading-${index}`} />
              ))}
            </>
          ) : props.tabName !== '已完成' ? (
            <>
              {filteredOrders.map((order) => (
                <POSLiveCard key={order.id} order={order} />
              ))}
              {fillerCount > 0 &&
                [...Array(fillerCount).keys()].map((index) => (
                  <div key={`filler-${index}`} />
                ))}
            </>
          ) : (
            // Optimize performance for archived orders
            <>
              {filteredOrders.map((order) => (
                <POSLiveCard
                  key={`archived-${order.id}`}
                  order={order}
                  isArchived={true}
                />
              ))}
              {fillerCount > 0 &&
                [...Array(fillerCount).keys()].map((index) => (
                  <div key={`filler-${index}`} />
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
