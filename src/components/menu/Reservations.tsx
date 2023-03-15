import { useMemo, useRef, useEffect } from 'react'
import { MenuType } from '@prisma/client'
import Link from 'next/link'
import { twMerge } from 'tailwind-merge'
import { motion } from 'framer-motion'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

import Title from '@/components/core/Title'
import trpc, { ReservationDatas } from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import { MenuTypeName, settings, twData } from '@/lib/common'
import Image from '@/components/core/Image'

const MENU_TYPE_ORDER = [
  MenuType.BREAKFAST,
  MenuType.LUNCH,
  MenuType.DINNER,
  MenuType.TEA,
  MenuType.LIVE,
  MenuType.RETAIL,
]

export default function Reservations(props: { activeMenuId?: number }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { data, isLoading, isError, error } =
    trpc.menu.getReservations.useQuery()

  const reservationMenusByDate = useMemo(() => {
    if (!data)
      return {
        '1月1日 週一': undefined,
        '1月2日 週一': undefined,
        '1月3日 週一': undefined,
      }

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

  // Remember scroll position
  useEffect(() => {
    if (!scrollRef.current) return

    const handleScroll = () => {
      if (!props.activeMenuId) {
        sessionStorage.setItem(
          'reservations-scroll-position',
          JSON.stringify(scrollRef.current?.scrollTop),
        )
      }
    }

    scrollRef.current.addEventListener('scroll', handleScroll)
    return () => {
      scrollRef.current?.removeEventListener('scroll', handleScroll)
    }
  }, [scrollRef.current])

  // Scroll to active menu if not visible
  useEffect(() => {
    if (!scrollRef.current) return

    // if activeMenuId is not set, scroll to previous position
    if (!props.activeMenuId) {
      const previousScrollPosition = JSON.parse(
        sessionStorage.getItem('reservations-scroll-position') || '0',
      )
      scrollRef.current.scrollTo({
        top: previousScrollPosition,
        behavior: 'auto',
      })
      return
    }

    const activeMenu = document.getElementById(
      `reserve-menu-${props.activeMenuId}`,
    )
    if (!activeMenu) return

    // Check visible
    const { top, bottom } = activeMenu.getBoundingClientRect()
    if (top < 0 || bottom > window.innerHeight) {
      scrollRef.current.scrollTo({
        top: activeMenu.offsetTop - 32,
        behavior: 'smooth',
      })
    }
  }, [props.activeMenuId])

  if (isError) return <Error description={error.message} />

  return (
    <>
      <Title prefix='預訂' />
      <div className='relative h-full w-full'>
        <main
          ref={scrollRef}
          className='ms-scroll group absolute inset-0 flex flex-col gap-8 overflow-y-auto p-4 data-loading:pointer-events-none lg:p-8'
          {...twData({ loading: isLoading })}
        >
          {/* Empty */}
          {!isLoading && data!.length === 0 && (
            <div className='flex h-full flex-col items-center justify-center gap-4'>
              <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
                <CalendarDaysIcon className='h-12 w-12 text-stone-400' />
              </div>
              <h1 className='indent-[0.1em] text-lg font-bold tracking-widest text-stone-500'>{`沒有可以預訂的菜單`}</h1>
            </div>
          )}
          {/* Main */}
          {Object.entries(reservationMenusByDate).map(([dateString, menus]) => (
            <section key={dateString}>
              {/* Date header */}
              <h1 className='mb-4 w-fit rounded-xl text-lg font-bold tracking-wider group-data-loading:skeleton'>
                {dateString}
              </h1>
              {/* Reservation List */}
              <div className='flex flex-col gap-4'>
                {/* Reservation card */}
                {(menus ?? (Array(3).fill(undefined) as undefined[])).map(
                  (menu, index) => (
                    <Link
                      id={`reserve-menu-${menu?.id ?? 'placeholder-' + index}`}
                      key={menu?.id ?? `placeholder-${index}`}
                      href={`/reserve/${menu?.id}`}
                      className={twMerge(
                        'group/card relative flex cursor-pointer gap-4 rounded-2xl p-2 data-selected:pointer-events-none hover:bg-stone-50 active:scale-[98%]',
                      )}
                      {...twData({ selected: props.activeMenuId === menu?.id })}
                    >
                      {/* MenuType */}
                      <div className='relative flex items-center justify-center'>
                        {props.activeMenuId !== menu?.id && (
                          <motion.div
                            layoutId={
                              menu ? `reserve-menu-${menu.id}` : undefined
                            }
                            className='absolute inset-0 rounded-2xl bg-stone-100'
                            transition={{ duration: 0.2, type: 'spring' }}
                          />
                        )}
                        <h2 className='relative z-[1] rounded-xl p-2 text-lg font-bold group-data-selected/card:text-yellow-500 group-data-loading:skeleton'>
                          {menu ? MenuTypeName[menu.type][0] : '菜'}
                        </h2>
                      </div>
                      <div className='flex flex-1 flex-col gap-2 overflow-hidden'>
                        {/* Com images */}
                        <div className='relative flex -space-x-3'>
                          {(menu
                            ? menu.commodities
                            : (Array(3).fill(undefined) as undefined[])
                          ).map((com, index) => (
                            <div
                              className='relative aspect-square w-12 shrink-0 overflow-hidden rounded-full border-2 border-white group-data-loading:skeleton lg:w-14'
                              style={{
                                zIndex: (menu?.commodities.length ?? 3) - index,
                              }}
                              key={com?.commodity.id ?? `placeholder-${index}`}
                            >
                              <Image
                                className='object-cover group-data-loading:hidden'
                                src={
                                  com?.commodity.image?.path ??
                                  settings.RESOURCE_FOOD_PLACEHOLDER
                                }
                                sizes='64px'
                                alt={com?.commodity.name ?? '餐點圖片'}
                              />
                            </div>
                          ))}
                          {/* Fader */}
                          <div className='absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-white to-transparent group-hover/card:from-stone-50 group-active/card:from-stone-50 group-data-selected/card:from-stone-100 group-data-loading:hidden'></div>
                        </div>
                        {/* Date close */}
                        <p className='w-fit whitespace-nowrap rounded-xl text-xs tracking-wider text-stone-400 group-data-loading:skeleton'>
                          {(menu
                            ?.closedDate!.toLocaleString('zh-TW', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric',
                            })
                            .replace('午', '午 ') ?? '1月1日 下午 6:00') +
                            ' 截止'}
                        </p>
                      </div>
                      {/*  */}
                      <div className='flex items-center'>
                        <div className='flex items-center gap-2'>
                          {menu && menu._count.orders > 0 && (
                            <p className='whitespace-nowrap text-sm text-stone-400'>
                              已預訂
                            </p>
                          )}
                          <ChevronRightIcon className='h-5 w-5 text-stone-400 group-data-selected/card:invisible' />
                        </div>
                      </div>
                      {/* Highlight BG */}
                      {menu && props.activeMenuId === menu.id && (
                        <motion.div
                          initial={false}
                          layoutId={`reserve-menu-${menu.id}`}
                          className='absolute inset-0 -z-[1] rounded-2xl bg-stone-100'
                          transition={{ duration: 0.2, type: 'spring' }}
                        />
                      )}
                    </Link>
                  ),
                )}
              </div>
            </section>
          ))}
        </main>
      </div>
    </>
  )
}
