import { Fragment } from 'react'

import trpc from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import { twData, MenuTypeName } from '@/lib/common'

export default function POSReservationList() {
  const { data, isLoading, isError, error } = trpc.pos.getReservation.useQuery()

  if (isError) {
    return <Error description={error.message} />
  }

  if (!data) return <div>empty</div>

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
          {data.map((menu) => (
            <Fragment key={menu.type}>
              {/* Menu header */}
              <h1 className='col-span-full text-lg font-bold'>
                {MenuTypeName[menu.type]}
              </h1>
              {/* COMs */}
              {menu.coms.map((com) => (
                <section
                  key={com.id}
                  className='relative flex h-max flex-col gap-4 overflow-hidden rounded-2xl border bg-white p-4 shadow-lg sm:min-h-[26rem] lg:p-6'
                >
                  {/* Name and total */}
                  <div className='flex justify-between text-lg font-bold'>
                    <p>{com.name}</p>
                    <p>{`x ${com.totalQuantity}`}</p>
                  </div>
                  {/* Options */}
                  <div className='flex flex-col gap-2'>
                    {com.optionsWithOrders.map((optionWithOrders, index) => (
                      <div key={index} className='flex justify-between'>
                        <div className='flex flex-wrap gap-2'>
                          {Object.values(optionWithOrders.option).map(
                            (value, index) => (
                              <p key={index}>{value}</p>
                            ),
                          )}
                        </div>
                        <p>{`x ${optionWithOrders.quantity}`}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
