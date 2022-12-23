import { AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'

import trpc from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import Title from '@/components/core/Title'
import POSCard from '@/components/pos/POSCard'

const TOTAL_FILLER_COUNT = 6

export default function PagePOS() {
  const { data, isError, isLoading, error } = trpc.pos.get.useQuery()
  const sortedOrders = useMemo(() => {
    if (!data) return []

    return data.sort((a, b) => {
      const aOrder = a.timeCompleted ? 1 : 0
      const bOrder = b.timeCompleted ? 1 : 0
      if (aOrder === bOrder) return 0
      return aOrder - bOrder
    })
  }, [data])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isError) {
    return <Error description={error.message} />
  }

  const fillerCount = Math.max(TOTAL_FILLER_COUNT - data.length)

  return (
    <>
      <Title prefix='處理訂單' />
      <div className='relative h-full w-full'>
        <div className='ms-scroll absolute inset-0 overflow-y-auto bg-stone-50 p-4 lg:p-8'>
          <div className='grid w-full grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4 lg:gap-8'>
            <AnimatePresence initial={false}>
              {sortedOrders.map((order) => (
                <POSCard key={order.id} order={order} />
              ))}
              {fillerCount > 0 &&
                [...Array(fillerCount).keys()].map((index) => (
                  <div key={`filler-${index}`} />
                ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  )
}
