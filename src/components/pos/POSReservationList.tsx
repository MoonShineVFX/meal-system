import { Fragment } from 'react'
import { ArchiveBoxIcon } from '@heroicons/react/24/outline'

import trpc from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import { twData, MenuTypeName, getMenuName } from '@/lib/common'
import POSReservationCard from './POSReservationCard'

const TOTAL_FILLER_COUNT = 6

export default function POSReservationList(props: {
  tabName: '今日預訂' | '未來預訂' | '未完成預訂'
}) {
  const isFuture = props.tabName === '未來預訂'

  const { data, isLoading, isError, error } = trpc.pos.getReservation.useQuery({
    type: props.tabName === '今日預訂' ? 'today' : isFuture ? 'future' : 'past',
  })

  if (isError) {
    return <Error description={error.message} />
  }

  const fillerCount = Math.max(TOTAL_FILLER_COUNT - (data?.length ?? 0))

  return (
    <div
      className='group h-full w-full'
      {...twData({
        loading: isLoading,
      })}
    >
      {/* Empty */}
      {data?.length === 0 && !isLoading && (
        <div className='flex h-full flex-col items-center justify-center gap-4'>
          <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
            <ArchiveBoxIcon className='h-12 w-12 text-stone-400' />
          </div>
          <h1 className='indent-[0.1em] text-lg font-bold tracking-widest text-stone-500'>{`沒有${props.tabName}的訂單`}</h1>
        </div>
      )}
      {/* Cards */}
      <div className='ms-scroll absolute inset-0 overflow-y-auto p-4 pt-[3.75rem] sm:pt-[4rem] lg:p-8'>
        <div className='grid min-h-full w-full auto-rows-min grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4 lg:gap-8'>
          {isLoading ? (
            <>
              <h1 className='col-span-full mt-4 w-fit rounded-xl text-lg font-bold first:mt-0 group-data-loading:skeleton lg:-mb-4'>
                1月1日 菜單
              </h1>
              {[...Array(6).keys()].map((index) => (
                <POSReservationCard key={`loading-${index}`} />
              ))}
            </>
          ) : (
            // Cards
            data!.map((menu) => (
              <Fragment key={`${menu.type}-${menu.date}`}>
                {/* Menu header */}
                <h1 className='col-span-full mt-4 w-fit text-lg font-bold first:mt-0 lg:-mb-4'>
                  {props.tabName === '今日預訂'
                    ? MenuTypeName[menu.type]
                    : getMenuName(menu)}
                </h1>
                {/* COMs */}
                {menu.coms.map((com) => (
                  <POSReservationCard
                    key={com.id}
                    com={com}
                    isFuture={isFuture}
                  />
                ))}
              </Fragment>
            ))
          )}
          {!isLoading &&
            data!.length > 0 &&
            fillerCount > 0 &&
            [...Array(fillerCount).keys()].map((index) => (
              <div key={`filler-${index}`} />
            ))}
        </div>
      </div>
    </div>
  )
}
