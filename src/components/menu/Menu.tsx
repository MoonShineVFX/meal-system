import type { MenuType } from '@prisma/client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { twMerge } from 'tailwind-merge'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'

import { twData, settings } from '@/lib/common'
import trpc from '@/lib/client/trpc'
import type {
  CommoditiesOnMenu,
  CommoditiesOnMenuByCategory,
} from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'
import COMsGrid from './COMsGrid'
import COMDialog from './COMDialog'
import { useStore } from '@/lib/client/store'

export default function Menu(props: {
  type: MenuType
  date?: Date
  className?: string
}) {
  const { data, isLoading, isError, error } = trpc.menu.get.useQuery({
    type: props.type,
    date: props.date,
  })
  const [currentCategory, setCurrentCategory] = useState(
    settings.MENU_CATEGORY_ALL,
  )
  const router = useRouter()
  const [selectedCom, setSelectedCom] = useState<CommoditiesOnMenu[0] | null>(
    null,
  )
  const [comsByCategory, setComsByCategory] =
    useState<CommoditiesOnMenuByCategory>({})
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)
  const unavailableMessage = useStore((state) => state.menuUnavailableMessage)
  const setUnavailableMessage = useStore(
    (state) => state.setMenuUnavailableMessage,
  )

  // Detect commodityId from query and open
  useEffect(() => {
    if (router.query.commodityId && data) {
      const commodityId = Number(router.query.commodityId)
      const com = data.commoditiesOnMenu.find(
        (com) => com.commodity.id === commodityId,
      )
      if (com) {
        setSelectedCom(com)
        setIsDetailOpen(true)
      }
    } else if (!router.query.commodityId && isDetailOpen) {
      setIsDetailOpen(false)
    }
  }, [router.query.commodityId, data])

  // Detect category from query and scroll to top
  useEffect(() => {
    if (router.query.category && data) {
      setCurrentCategory(router.query.category as string)
    } else if (!router.query.category) {
      setCurrentCategory(settings.MENU_CATEGORY_ALL)
    }
    if (detailRef.current) {
      detailRef.current.scrollTop = 0
    }
  }, [router.query.category, data, detailRef.current])

  // On data change
  useEffect(() => {
    if (!data) return

    // Group commodities by category
    const comsByCategory: CommoditiesOnMenuByCategory = {}
    for (const com of data.commoditiesOnMenu) {
      const categories = com.commodity.categories
      if (categories.length > 0) {
        for (const category of categories) {
          if (!comsByCategory[category.mainName]) {
            comsByCategory[category.mainName] = {}
          }
          if (!comsByCategory[category.mainName][category.subName]) {
            comsByCategory[category.mainName][category.subName] = []
          }
          comsByCategory[category.mainName][category.subName].push(com)
        }
      } else {
        if (!(settings.MENU_CATEGORY_NULL in comsByCategory)) {
          comsByCategory[settings.MENU_CATEGORY_NULL] = { 未分類: [] }
        }
        comsByCategory[settings.MENU_CATEGORY_NULL][
          settings.MENU_CATEGORY_NULL
        ].push(com)
      }
    }

    const result = Object.keys(comsByCategory)
      .sort((a, b) =>
        b === settings.MENU_CATEGORY_NULL
          ? -1
          : a === settings.MENU_CATEGORY_NULL
          ? 1
          : 0,
      )
      .reduce((acc: CommoditiesOnMenuByCategory, key) => {
        acc[key] = comsByCategory[key]
        return acc
      }, {})

    setComsByCategory(result)

    // Reset category
    setCurrentCategory(settings.MENU_CATEGORY_ALL)

    // Validate menu
    const now = new Date()
    if (data.menu.closedDate && data.menu.closedDate < now) {
      setUnavailableMessage('已經關閉訂購')
    } else if (data.menu.publishedDate && data.menu.publishedDate > now) {
      setUnavailableMessage('尚未開放訂購')
    } else if (
      data.menu.limitPerUser > 0 &&
      data.menu.limitPerUser - data.menu.userOrderedCount! <= 0
    ) {
      setUnavailableMessage('已達全部餐點每人訂購上限')
    } else {
      setUnavailableMessage(null)
    }
  }, [data])

  const handleDetailClose = useCallback(() => {
    if (router.query.commodityId) {
      const { commodityId, ...query } = router.query
      router.push(
        {
          pathname: router.pathname,
          query,
        },
        undefined,
        { shallow: true },
      )
    }
  }, [router.query])

  const handleCategoryClick = useCallback(
    (category: string) => {
      if (router.query.category !== category) {
        router.push(
          {
            pathname: router.pathname,
            query: {
              ...router.query,
              category,
            },
          },
          undefined,
          { shallow: true },
        )
      }
    },
    [router],
  )

  if (isError) return <div className='text-red-400'>{error.message}</div>
  if (isLoading) return <Spinner className='h-6 w-6' />

  return (
    <div className={twMerge('relative h-full bg-white', props.className)}>
      <div className='absolute inset-0 flex flex-col lg:flex-row'>
        {/* Categories */}
        <ul className='absolute z-10 flex w-full gap-4 overflow-x-auto bg-white/80 p-4 py-2 shadow backdrop-blur lg:static lg:w-max lg:flex-col lg:p-8 lg:pr-0 lg:shadow-none lg:backdrop-blur-none'>
          {[settings.MENU_CATEGORY_ALL, ...Object.keys(comsByCategory)].map(
            (mainCategory) => (
              <li
                data-ui={twData({
                  selected: currentCategory === mainCategory,
                })}
                key={mainCategory}
                className='w-fit shrink-0 cursor-pointer rounded-2xl px-2 py-1 text-stone-500 data-selected:pointer-events-none data-selected:bg-yellow-500 data-selected:text-yellow-900 data-not-selected:hover:bg-stone-600/10 data-not-selected:active:bg-stone-600/10 lg:data-not-selected:hover:bg-stone-100 lg:data-not-selected:active:bg-stone-100'
                onClick={() => handleCategoryClick(mainCategory)}
              >
                <p className='text-justify indent-[0.1em] text-sm font-bold tracking-widest sm:text-base'>
                  {mainCategory}
                </p>
              </li>
            ),
          )}
        </ul>
        {/* Commodities */}
        <section className='relative grow'>
          <div
            ref={detailRef}
            className='absolute inset-0 overflow-y-auto p-4 pt-[60px] @container/coms sm:pt-[64px] lg:p-8'
          >
            {unavailableMessage && (
              <section className='mb-4 flex items-center gap-2 rounded-md bg-stone-100 p-4 text-stone-500'>
                <ExclamationTriangleIcon className='h-5 w-5 text-yellow-400' />
                {unavailableMessage}
              </section>
            )}
            <COMsGrid
              currentCategory={currentCategory}
              comsByCategory={comsByCategory}
            />
          </div>
        </section>
      </div>
      {/* Commodity detail */}
      <COMDialog
        isOpen={isDetailOpen}
        com={selectedCom ?? undefined}
        onClose={handleDetailClose}
      />
    </div>
  )
}
