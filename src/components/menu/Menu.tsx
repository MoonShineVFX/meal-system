import type { MenuType } from '@prisma/client'
import { useMemo, useState, useCallback, useEffect } from 'react'
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

  const handleCategoryClick = useCallback((mainCategory: string) => {
    setCurrentCategory(mainCategory)
  }, [])

  if (isError) return <div className='text-red-400'>{error.message}</div>
  if (isLoading) return <Spinner className='h-6 w-6' />

  return (
    <div className='relative h-full bg-stone-100'>
      <div className='absolute inset-0 lg:flex'>
        {/* Categories */}
        <div className='absolute z-10 w-full overflow-x-auto p-4 lg:static lg:w-min lg:p-8'>
          <div className='flex w-max gap-4 self-start rounded-2xl bg-white p-2 shadow lg:flex-col lg:p-4'>
            {[
              settings.MENU_CATEGORY_ALL,
              ...Object.keys(commoditiesOnMenuByCategory),
            ].map((mainCategory) => (
              <div
                data-ui={twData({
                  selected: currentCategory === mainCategory,
                })}
                key={mainCategory}
                className='shrink-0 cursor-pointer rounded-2xl px-3 py-2 text-stone-500 data-selected:pointer-events-none data-selected:bg-yellow-500 data-selected:text-yellow-900 data-not-selected:hover:bg-stone-200'
                onClick={() => handleCategoryClick(mainCategory)}
              >
                <h2 className='tracking-widest'>{mainCategory}</h2>
              </div>
            ))}
          </div>
        </div>
        {/* Commodities */}
        <div className='relative h-full grow'>
          <div className='absolute inset-0 overflow-y-auto p-4 pt-24 lg:p-8 lg:pl-0'>
            <CommodityOnMenuList
              currentCategory={currentCategory}
              commoditiesOnMenuByCategory={commoditiesOnMenuByCategory}
            />
          </div>
        </div>
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
