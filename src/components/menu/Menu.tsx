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
import COMsGrid from './COMsGrid'
import COMDialog from './COMDialog'
import { useStore } from '@/lib/client/store'

const categoriesPlaceholder = Array(5).fill('分類')

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
  const [isDialogOpen, setIsDetailOpen] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)
  const setCurrentMenu = useStore((state) => state.setCurrentMenu)

  // Detect commodityId from query and open
  useEffect(() => {
    if (router.query.commodityId && data) {
      const commodityId = Number(router.query.commodityId)
      const com = data.commodities.find(
        (com) => com.commodity.id === commodityId,
      )
      if (com) {
        setSelectedCom(com)
        setIsDetailOpen(true)
      }
    } else if (!router.query.commodityId && isDialogOpen) {
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
    for (const com of data.commodities) {
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
    setCurrentCategory(settings.MENU_CATEGORY_ALL)
    setCurrentMenu(data)
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

  const categories = isLoading
    ? categoriesPlaceholder
    : [settings.MENU_CATEGORY_ALL, ...Object.keys(comsByCategory)]
  const coms = isLoading ? undefined : comsByCategory

  return (
    <div
      className={twMerge(
        'group/menu relative h-full bg-white',
        props.className,
      )}
      data-ui={twData({ loading: isLoading })}
    >
      <div className='absolute inset-0 flex flex-col lg:flex-row'>
        {/* Categories */}
        <ul className='absolute z-10 flex w-full gap-4 overflow-x-auto bg-white/80 p-4 py-2 shadow backdrop-blur lg:static lg:w-max lg:flex-col lg:p-8 lg:pr-0 lg:shadow-none lg:backdrop-blur-none'>
          {categories.map((mainCategory, index) => (
            <li
              data-ui={twData({
                selected: currentCategory === mainCategory,
              })}
              key={`category-${index}`}
              className='w-fit shrink-0 cursor-pointer rounded-2xl px-2 py-1 text-stone-500 data-selected:pointer-events-none data-selected:bg-yellow-500 data-selected:text-yellow-900 data-not-selected:hover:bg-stone-600/10 data-not-selected:active:bg-stone-600/10 group-data-loading/menu:skeleton lg:data-not-selected:hover:bg-stone-100 lg:data-not-selected:active:bg-stone-100'
              onClick={() => handleCategoryClick(mainCategory)}
            >
              <p className='text-justify indent-[0.1em] text-sm font-bold tracking-widest group-data-loading/menu:text-transparent sm:text-base'>
                {mainCategory}
              </p>
            </li>
          ))}
        </ul>
        {/* Commodities */}
        <section className='relative grow'>
          <div
            ref={detailRef}
            className='absolute inset-0 overflow-y-auto p-4 pt-[3.75rem] @container/coms sm:pt-[4rem] lg:p-8'
          >
            {data && data.unavailableReasons.length > 0 && (
              <section className='mb-4 flex flex-col gap-1 rounded-md bg-stone-100 p-4 text-stone-500'>
                <div className='flex items-center gap-2'>
                  <ExclamationTriangleIcon className='h-5 w-5 text-yellow-400' />
                  目前無法訂購餐點
                </div>
                <ul className='flex flex-col gap-1 text-stone-400'>
                  {data.unavailableReasons.map((reson) => (
                    <li className='ml-7 text-sm' key={reson}>
                      {settings.MENU_UNAVAILABLE_REASON_MESSAGE[reson]}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <COMsGrid currentCategory={currentCategory} comsByCategory={coms} />
          </div>
        </section>
      </div>
      {/* Commodity detail */}
      <COMDialog
        isOpen={isDialogOpen}
        com={selectedCom ?? undefined}
        onClose={handleDetailClose}
      />
    </div>
  )
}
