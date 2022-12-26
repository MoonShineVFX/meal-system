import { AnimatePresence, MotionConfig } from 'framer-motion'
import { useMemo, useState } from 'react'

import trpc from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import Title from '@/components/core/Title'
import POSCard from '@/components/pos/POSCard'
import Tab from '@/components/core/Tab'
import { twData } from '@/lib/common'
import { ArchiveBoxIcon } from '@heroicons/react/24/outline'

const TOTAL_FILLER_COUNT = 6
const TAB_NAMES = ['待處理', '已出餐', '已完成'] as const

export default function PagePOS() {
  const [currentTabName, setCurrentTabName] =
    useState<typeof TAB_NAMES[number]>('待處理')
  const { data, isError, isLoading, error } = trpc.pos.get.useQuery({
    checkArchived: currentTabName === '已完成',
  })
  const filteredOrders = useMemo(() => {
    if (!data) return []

    if (currentTabName === '待處理') {
      return data.sort((a, b) => {
        const aOrder = a.timeDishedUp ? 1 : 0
        const bOrder = b.timeDishedUp ? 1 : 0
        if (aOrder === bOrder) return 0
        return aOrder - bOrder
      })
    } else if (currentTabName === '已出餐') {
      return data.filter((order) => order.timeDishedUp !== null)
    } else if (currentTabName === '已完成') {
      return data
    }

    return []
  }, [data, currentTabName])

  if (isError) {
    return <Error description={error.message} />
  }

  const fillerCount = Math.max(TOTAL_FILLER_COUNT - filteredOrders.length)

  return (
    <>
      <Title prefix='處理訂單' />
      <div
        className='group relative flex h-full w-full data-loading:pointer-events-none'
        {...twData({ loading: isLoading })}
      >
        {/* Categories */}
        <Tab
          tabNames={TAB_NAMES}
          currentTabName={currentTabName}
          onClick={setCurrentTabName}
        />
        {/* Pos */}
        <div className='relative grow'>
          {/* Empty */}
          {filteredOrders.length === 0 && !isLoading && (
            <div className='flex h-full flex-col items-center justify-center gap-2 sm:gap-4'>
              <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
                <ArchiveBoxIcon className='h-12 w-12 text-stone-400' />
              </div>
              <h1 className='text-lg font-bold'>{`沒有${currentTabName}的訂單`}</h1>
            </div>
          )}
          {/* Cards */}
          <div className='ms-scroll absolute inset-0 overflow-y-auto p-4 pt-[3.75rem] sm:pt-[4rem] lg:p-8'>
            <div className='grid w-full grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4 lg:gap-8'>
              {isLoading ? (
                <>
                  {[...Array(6).keys()].map((index) => (
                    <POSCard key={`loading-${index}`} />
                  ))}
                </>
              ) : currentTabName !== '已完成' ? (
                <AnimatePresence initial={false}>
                  {filteredOrders.map((order) => (
                    <POSCard key={order.id} order={order} />
                  ))}
                  {fillerCount > 0 &&
                    [...Array(fillerCount).keys()].map((index) => (
                      <div key={`filler-${index}`} />
                    ))}
                </AnimatePresence>
              ) : (
                // Optimize performance for archived orders
                <MotionConfig reducedMotion='always'>
                  {filteredOrders.map((order) => (
                    <POSCard key={order.id} order={order} isArchived={true} />
                  ))}
                  {fillerCount > 0 &&
                    [...Array(fillerCount).keys()].map((index) => (
                      <div key={`filler-${index}`} />
                    ))}
                </MotionConfig>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
