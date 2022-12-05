import type { MenuType } from '@prisma/client'
import { useMemo } from 'react'

import type { RouterOutput } from '@/lib/client/trpc'
import trpc from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'
import CommodityCard from './CommodityCard'

type CommoditiesOnMenu = RouterOutput['menu']['get']['commoditiesOnMenu']
type CommoditiesOnMenuByCategory = Record<
  string,
  Record<string, CommoditiesOnMenu>
>

export default function Menu(props: { type: MenuType; date?: Date }) {
  const { data, isLoading, isError, error } = trpc.menu.get.useQuery({
    type: props.type,
    date: props.date,
  })
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
        if (!('未分類' in catMap)) {
          catMap['未分類'] = { 未分類: [] }
        }
        catMap['未分類']['未分類'].push(commodityOnMenu)
      }
    }
    return Object.keys(catMap)
      .sort((a, b) => (b === '未分類' ? 1 : a === '未分類' ? -1 : 0))
      .reduce((acc: CommoditiesOnMenuByCategory, key) => {
        acc[key] = catMap[key]
        return acc
      }, {})
  }, [data])

  if (isError) return <div className='text-red-400'>{error.message}</div>
  if (isLoading) return <Spinner className='h-6 w-6' />

  return (
    <div className='h-full bg-gray-100'>
      <section>
        {Object.entries(commodities).map(([mainCategory, subCategories]) => (
          <div key={mainCategory}>
            <h2 className='text-xl font-bold'>{mainCategory}</h2>
            {Object.entries(subCategories).map(
              ([subCategory, commoditiesOnMenu]) => (
                <div key={subCategory}>
                  <h3 className='text-lg font-bold'>{subCategory}</h3>
                  {commoditiesOnMenu.map((commodityOnMenu) => (
                    <CommodityCard
                      key={commodityOnMenu.commodity.id}
                      commodityOnMenu={commodityOnMenu}
                    />
                  ))}
                </div>
              ),
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
