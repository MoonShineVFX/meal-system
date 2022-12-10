import type { MenuType } from '@prisma/client'
import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

import { twData, settings } from '@/lib/common'
import trpc from '@/lib/client/trpc'
import type {
  CommoditiesOnMenu,
  CommoditiesOnMenuByCategory,
} from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'
import CommodityOnMenuList from './CommodityOnMenuList'
import CommodityOnMenuDetail from './CommodityOnMenuDetail'

export default function Menu(props: { type: MenuType; date?: Date }) {
  const { data, isLoading, isError, error } = trpc.menu.get.useQuery({
    type: props.type,
    date: props.date,
  })
  const [currentCategory, setCurrentCategory] = useState(
    settings.MENU_CATEGORY_ALL,
  )
  const router = useRouter()
  const [selectedCommodityOnMenu, setSelectedCommodityOnMenu] = useState<
    CommoditiesOnMenu[0] | null
  >(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)

  // Detect commodityId from query and open
  useEffect(() => {
    if (router.query.commodityId && data) {
      const commodityId = Number(router.query.commodityId)
      const commodityOnMenu = data.commoditiesOnMenu.find(
        (commodityOnMenu) => commodityOnMenu.commodity.id === commodityId,
      )
      if (commodityOnMenu) {
        setSelectedCommodityOnMenu(commodityOnMenu)
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

  // Group commodities by category
  const commoditiesOnMenuByCategory = useMemo(() => {
    if (!data) return {}
    const catMap: CommoditiesOnMenuByCategory = {}
    for (const commodityOnMenu of data.commoditiesOnMenu) {
      const categories = commodityOnMenu.commodity.categories
      if (categories.length > 0) {
        for (const category of categories) {
          if (!catMap[category.mainName]) {
            catMap[category.mainName] = {}
          }
          if (!catMap[category.mainName][category.subName]) {
            catMap[category.mainName][category.subName] = []
          }
          catMap[category.mainName][category.subName].push(commodityOnMenu)
        }
      } else {
        if (!(settings.MENU_CATEGORY_NULL in catMap)) {
          catMap[settings.MENU_CATEGORY_NULL] = { 未分類: [] }
        }
        catMap[settings.MENU_CATEGORY_NULL][settings.MENU_CATEGORY_NULL].push(
          commodityOnMenu,
        )
      }
    }

    setCurrentCategory(settings.MENU_CATEGORY_ALL)

    return Object.keys(catMap)
      .sort((a, b) =>
        b === settings.MENU_CATEGORY_NULL
          ? -1
          : a === settings.MENU_CATEGORY_NULL
          ? 1
          : 0,
      )
      .reduce((acc: CommoditiesOnMenuByCategory, key) => {
        acc[key] = catMap[key]
        return acc
      }, {})
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
    <div className='relative h-full bg-white'>
      <div className='absolute inset-0 flex flex-col lg:flex-row'>
        {/* Categories */}
        <ul className='absolute z-10 flex w-full gap-4 overflow-x-auto bg-white/80 p-4 shadow backdrop-blur lg:static lg:w-max lg:flex-col lg:p-8 lg:pr-0 lg:shadow-none lg:backdrop-blur-none'>
          {[
            settings.MENU_CATEGORY_ALL,
            ...Object.keys(commoditiesOnMenuByCategory),
          ].map((mainCategory) => (
            <li
              data-ui={twData({
                selected: currentCategory === mainCategory,
              })}
              key={mainCategory}
              className='w-fit shrink-0 cursor-pointer rounded-2xl px-3 py-2 text-stone-500 data-selected:pointer-events-none data-selected:bg-yellow-500 data-selected:text-yellow-900 data-not-selected:hover:bg-stone-600/10 data-not-selected:active:bg-stone-600/10 lg:data-not-selected:hover:bg-stone-100 lg:data-not-selected:active:bg-stone-100'
              onClick={() => handleCategoryClick(mainCategory)}
            >
              <p className='text-justify font-bold tracking-widest'>
                {mainCategory}
              </p>
            </li>
          ))}
        </ul>
        {/* Commodities */}
        <section className='relative grow'>
          <div
            ref={detailRef}
            className='absolute inset-0 overflow-y-auto p-4 pt-[88px] lg:p-8'
          >
            <CommodityOnMenuList
              currentCategory={currentCategory}
              commoditiesOnMenuByCategory={commoditiesOnMenuByCategory}
            />
          </div>
        </section>
      </div>
      {/* Commodity detail */}
      <CommodityOnMenuDetail
        isOpen={isDetailOpen}
        commodityOnMenu={selectedCommodityOnMenu ?? undefined}
        onClose={handleDetailClose}
      />
    </div>
  )
}
