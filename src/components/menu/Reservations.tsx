import { useMemo } from 'react'
import { MenuType } from '@prisma/client'
import Link from 'next/link'

import Title from '@/components/core/Title'
import trpc, { ReservationDatas } from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import { MenuTypeName, settings } from '@/lib/common'
import Image from '@/components/core/Image'

const MENU_TYPE_ORDER = [
  MenuType.BREAKFAST,
  MenuType.LUNCH,
  MenuType.DINNER,
  MenuType.TEA,
  MenuType.MAIN,
]

export default function Reservations() {
  const { data, isLoading, isError, error } =
    trpc.menu.getReservations.useQuery()
  const reservationMenusByDate = useMemo(() => {
    if (!data) return {}

    // Map the data with date as key
    const thisRservationMenusByDate = data.reduce(
      (acc: Record<string, ReservationDatas>, menu) => {
        const date = menu.date!.toLocaleDateString('zh-TW', {
          weekday: 'short',
          month: 'long',
          day: 'numeric',
        })
        if (!acc[date]) acc[date] = []
        acc[date].push(menu)
        return acc
      },
      {},
    )

    // Sort the data by menu type
    Object.keys(thisRservationMenusByDate).forEach((date) => {
      thisRservationMenusByDate[date].sort((a, b) => {
        return MENU_TYPE_ORDER.indexOf(a.type) - MENU_TYPE_ORDER.indexOf(b.type)
      })
    })

    return thisRservationMenusByDate
  }, [data])

  if (isLoading) return <div>Loading...</div>
  if (isError) return <Error description={error.message} />

  return (
    <>
      <Title prefix='預訂' />
      <div className='relative h-full w-full'>
        <main className='ms-scroll absolute inset-0 flex flex-col gap-8 overflow-y-auto py-4 lg:py-8'>
          {Object.entries(reservationMenusByDate).map(([dateString, menus]) => (
            <section key={dateString}>
              {/* Date header */}
              <h1 className='mb-4 pl-4 text-lg font-bold lg:pl-8'>
                {dateString}
              </h1>
              {/* Reservation List */}
              <div className='flex flex-col gap-4'>
                {/* Reservation card */}
                {menus.map((menu) => (
                  <Link
                    key={menu.id}
                    href={`/reserve/${menu.id}`}
                    className='flex cursor-pointer gap-4 py-2 px-4 hover:bg-stone-100 active:scale-[98%] active:bg-stone-100 lg:px-8'
                  >
                    <div className='flex aspect-square items-center justify-center rounded-xl bg-stone-200'>
                      <h2 className='p-2 text-lg font-bold'>
                        {MenuTypeName[menu.type][0]}
                      </h2>
                    </div>
                    <div className='flex grow flex-col gap-2 overflow-hidden'>
                      {/* Com names */}
                      <div className='flex -space-x-3'>
                        {menu.commodities.map((com, index) => (
                          <div
                            className='relative aspect-square w-12 overflow-hidden rounded-full border-2 border-white'
                            style={{ zIndex: menu.commodities.length - index }}
                            key={com.commodity.id}
                          >
                            <Image
                              className='object-cover'
                              src={
                                com.commodity.image?.path ??
                                settings.RESOURCE_FOOD_PLACEHOLDER
                              }
                              sizes='48px'
                              alt={com?.commodity.name ?? '餐點圖片'}
                            />
                          </div>
                        ))}
                      </div>
                      <p className='text-xs text-stone-400'>
                        {menu.closedDate!.toLocaleString('zh-TW', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                        }) + ' 截止'}
                      </p>
                      {menu._count.orders > 0 && <p>已訂購</p>}
                    </div>
                    <div>{'>'}</div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </>
  )
}
