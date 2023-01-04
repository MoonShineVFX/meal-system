import { Fragment } from 'react'

import trpc from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import { twData, MenuTypeName, getMenuName } from '@/lib/common'
import POSReservationCard from './POSReservationCard'

export default function POSReservationList(props: {
  tabName: '今日預訂' | '未來預訂'
}) {
  const isFuture = props.tabName === '未來預訂'

  const { data, isLoading, isError, error } = trpc.pos.getReservation.useQuery({
    type: isFuture ? 'future' : 'today',
  })

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
      {/* Cards */}
      <div className='ms-scroll absolute inset-0 overflow-y-auto p-4 pt-[3.75rem] sm:pt-[4rem] lg:p-8'>
        <div className='grid w-full grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4 lg:gap-8'>
          {isLoading ? (
            <>
              <h1 className='col-span-full mt-4 w-fit rounded-xl text-lg font-bold first:mt-0 group-data-loading:skeleton lg:-mb-4'>
                菜單
              </h1>
              {[...Array(6).keys()].map((index) => (
                <POSReservationCard key={`loading-${index}`} />
              ))}
            </>
          ) : (
            data!.map((menu) => (
              <Fragment key={menu.type}>
                {/* Menu header */}
                <h1 className='col-span-full mt-4 text-lg font-bold first:mt-0 lg:-mb-4'>
                  {isFuture ? getMenuName(menu) : MenuTypeName[menu.type]}
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
        </div>
      </div>
    </div>
  )
}
