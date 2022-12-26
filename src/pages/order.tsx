import { useState } from 'react'

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
        className='group flex h-full w-full justify-center data-loading:pointer-events-none'
        {...twData({ loading: isLoading })}
      >
        <div className='relative flex w-full lg:max-w-4xl lg:gap-8'>
          {/* Tab */}
          <Tab
            tabNames={TAB_NAMES}
            currentTabName={currentTabName}
            onClick={setCurrentTabName}
          />
          {/* Content */}
          <div className='ms-scroll relative flex-1 overflow-auto'>
            <div className='absolute inset-x-0 top-0 h-max min-h-full pt-[3.75rem] sm:pt-[4rem] lg:pt-8'>
              {/* Empty */}
              {(data?.length ?? 0) === 0 && !isLoading && (
                <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-4'>
                  <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
                    <InboxIcon className='h-12 w-12 text-stone-400' />
                  </div>
                  <h1 className='text-lg font-bold'>{`沒有${currentTabName}的訂單`}</h1>
                </div>
              )}
              {/* Orders */}
              <section className='flex flex-col'>
                {(isLoading || !data
                  ? ([...Array(4).fill(undefined)] as undefined[])
                  : data
                ).map((order, index) => (
                  <OrderCard order={order} key={order?.id ?? index} />
                ))}
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
