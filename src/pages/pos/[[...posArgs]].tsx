import { AnimatePresence, MotionConfig } from 'framer-motion'
import { useMemo } from 'react'
import { ArchiveBoxIcon } from '@heroicons/react/24/outline'
import { GetServerSideProps } from 'next'

import trpc from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import Title from '@/components/core/Title'
import POSCard from '@/components/pos/POSCard'
import Tab from '@/components/core/Tab'
import { twData } from '@/lib/common'

const TOTAL_FILLER_COUNT = 6
const TAB_NAMES = ['待處理', '已出餐', '已完成', '今日預訂'] as const
type TabName = typeof TAB_NAMES[number]
const TAB_PATHS = ['live', 'dishedUp', 'archived', 'reservation'] as const
type TabPath = typeof TAB_PATHS[number]
const TAB_LINKS = TAB_PATHS.map((path) => `/pos/${path}`)

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { posArgs } = context.params as { posArgs?: string[] }

  let tabName: TabName

  if (!Array.isArray(posArgs) || posArgs.length === 0) {
    // for default
    tabName = TAB_NAMES[0]
  } else {
    const foundIndex = TAB_PATHS.indexOf(posArgs[0] as TabPath)
    if (foundIndex !== -1) {
      tabName = TAB_NAMES[foundIndex]
    } else {
      tabName = TAB_NAMES[0]
    }
  }

  return {
    props: {
      tabName,
    },
  }
}

export default function PagePOS(props: { tabName: TabName }) {
  const currentTabName = props.tabName
  const { data, isError, isLoading, error } = trpc.pos.get.useQuery({
    type:
      currentTabName === '已完成'
        ? 'archived'
        : currentTabName === '今日預訂'
        ? 'reservation'
        : 'live',
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
          tabLinks={TAB_LINKS}
          disableLoading={true}
        />
        {/* Pos */}
        <div className='relative grow'>
          {/* Empty */}
          {filteredOrders.length === 0 && !isLoading && (
            <div className='flex h-full flex-col items-center justify-center gap-4'>
              <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
                <ArchiveBoxIcon className='h-12 w-12 text-stone-400' />
              </div>
              <h1 className='indent-[0.1em] text-lg font-bold tracking-widest text-stone-500'>{`沒有${currentTabName}的訂單`}</h1>
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
