import { useState, useRef } from 'react'
import { Virtuoso } from 'react-virtuoso'

import Error from '@/components/core/Error'
import trpc from '@/lib/client/trpc'
import OrderCard from '@/components/order/OrderCard'
import Title from '@/components/core/Title'
import { twData } from '@/lib/common'
import Tab from '@/components/core/Tab'
import { InboxIcon } from '@heroicons/react/24/outline'

const TAB_NAMES = ['即時', '預訂', '已完成'] as const

export default function PageOrder() {
  const [currentTabName, setCurrentTabName] =
    useState<typeof TAB_NAMES[number]>('即時')
  const scrollRef = useRef<HTMLDivElement>(null)
  const { data, isError, error, isLoading } = trpc.order.get.useQuery({
    type:
      currentTabName == '即時'
        ? 'live'
        : currentTabName == '預訂'
        ? 'reservation'
        : 'archived',
  })

  if (isError) {
    return <Error description={error.message} />
  }

  return (
    <>
      <Title prefix='訂單' />
      <div
        ref={scrollRef}
        className='ms-scroll group flex h-full w-full justify-center overflow-y-scroll data-loading:pointer-events-none'
        {...twData({ loading: isLoading })}
      >
        <div className='flex w-full lg:max-w-4xl lg:gap-8'>
          {/* Tab */}
          <Tab
            tabNames={TAB_NAMES}
            currentTabName={currentTabName}
            onClick={setCurrentTabName}
          />
          {/* Content */}
          <div className='relative flex-1'>
            {/* Empty / Orders */}
            {(data?.length ?? 0) === 0 && !isLoading ? (
              <div className='flex h-full flex-col items-center justify-center gap-2 sm:gap-4'>
                <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
                  <InboxIcon className='h-12 w-12 text-stone-400' />
                </div>
                <h1 className='text-lg font-bold'>{`沒有${currentTabName}的訂單`}</h1>
              </div>
            ) : (
              <div className='absolute inset-x-0 top-0'>
                {/* Orders */}
                <Virtuoso
                  customScrollParent={scrollRef.current as HTMLDivElement}
                  className='ms-scroll'
                  data={
                    isLoading
                      ? ([...Array(4).fill(undefined)] as undefined[])
                      : data
                  }
                  itemContent={(index, order) => (
                    <OrderCard
                      order={order}
                      key={order?.id ?? index}
                      isFirst={index === 0}
                      isLast={index === (data?.length ?? 1) - 1}
                    />
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
