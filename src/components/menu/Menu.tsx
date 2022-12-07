import type { MenuType } from '@prisma/client'
import { useMemo, Fragment, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'

import { twData } from '@/lib/common'
import type { RouterOutput } from '@/lib/client/trpc'
import trpc from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'
import CommodityOnMenuCard from './CommodityOnMenuCard'
import CommodityOnMenuDetail from './CommodityOnMenuDetail'

type CommoditiesOnMenu = RouterOutput['menu']['get']['commoditiesOnMenu']
type CommoditiesOnMenuByCategory = Record<
  string,
  Record<string, CommoditiesOnMenu>
>

const CAT_ALL = '全部'
const CAT_NULL = '未分類'

export default function Menu(props: { type: MenuType; date?: Date }) {
  const { data, isLoading, isError, error } = trpc.menu.get.useQuery({
    type: props.type,
    date: props.date,
  })
  const [currentCategory, setCurrentCategory] = useState(CAT_ALL)
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
  const commodities = useMemo(() => {
    if (!data) return []
    const catMap: CommoditiesOnMenuByCategory = {}
    for (const commodityOnMenu of data.commoditiesOnMenu) {
      const subCategory = commodityOnMenu.commodity.subCategory
      if (subCategory) {
        if (!catMap[subCategory.mainCategory.name]) {
          catMap[subCategory.mainCategory.name] = {}
        }
        if (!catMap[subCategory.mainCategory.name][subCategory.name]) {
          catMap[subCategory.mainCategory.name][subCategory.name] = []
        }
        catMap[subCategory.mainCategory.name][subCategory.name].push(
          commodityOnMenu,
        )
      } else {
        if (!(CAT_NULL in catMap)) {
          catMap[CAT_NULL] = { 未分類: [] }
        }
        catMap[CAT_NULL][CAT_NULL].push(commodityOnMenu)
      }
    }

    setCurrentCategory(CAT_ALL)

    return Object.keys(catMap)
      .sort((a, b) => (b === CAT_NULL ? 1 : a === CAT_NULL ? -1 : 0))
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
    <div className='relative h-full bg-gray-200'>
      <div className='absolute inset-0 grid grid-rows-[min-content_auto] @2xl/main:grid-cols-[160px_auto] @2xl/main:grid-rows-none'>
        {/* Categories */}
        <div className='flex gap-4 overflow-x-auto p-4 pb-0 @2xl/main:flex-col sm:p-8 sm:pb-0'>
          {[CAT_ALL, ...Object.keys(commodities)].map((mainCategory) => (
            <div
              data-ui={twData({ selected: currentCategory === mainCategory })}
              key={mainCategory}
              className='shrink-0 cursor-pointer rounded-2xl bg-gray-100 p-3 tracking-widest data-selected:pointer-events-none data-selected:bg-violet-500 data-selected:text-white data-not-selected:hover:bg-gray-50'
              onClick={() => handleCategoryClick(mainCategory)}
            >
              <h2 className='text-lg'>{mainCategory}</h2>
            </div>
          ))}
        </div>
        {/* Commodities */}
        <div className='relative h-full'>
          <div className='absolute inset-0 overflow-y-auto p-4 @2xl/main:-ml-8 sm:p-8'>
            <div className='grid w-full grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8'>
              {Object.entries(commodities)
                .filter(([mainCategory]) => {
                  if (currentCategory === CAT_ALL) return true
                  return mainCategory === currentCategory
                })
                .map(([mainCategory, subCategories]) => (
                  <Fragment key={mainCategory}>
                    <h2 className='col-span-full text-3xl font-bold'>
                      {mainCategory}
                    </h2>
                    {Object.entries(subCategories).map(
                      ([subCategory, commoditiesOnMenu]) => (
                        <Fragment key={subCategory}>
                          <h3 className='col-span-full text-lg font-bold'>
                            {subCategory}
                          </h3>
                          {commoditiesOnMenu.map((commodityOnMenu) => (
                            <CommodityOnMenuCard
                              key={commodityOnMenu.commodity.id}
                              commodityOnMenu={commodityOnMenu}
                            />
                          ))}
                        </Fragment>
                      ),
                    )}
                  </Fragment>
                ))}
            </div>
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
