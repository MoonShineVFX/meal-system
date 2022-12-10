import { Fragment } from 'react'
import { twMerge } from 'tailwind-merge'

import { settings } from '@/lib/common'
import type { CommoditiesOnMenuByCategory } from '@/lib/client/trpc'
import CommodityOnMenuCard from './CommodityOnMenuCard'

export default function CommoditiesOnMenuList(props: {
  currentCategory: string
  commoditiesOnMenuByCategory: CommoditiesOnMenuByCategory
}) {
  const { currentCategory, commoditiesOnMenuByCategory: commodities } = props

  return (
    <section className='grid w-full grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-8 @2xl/coms:grid-cols-4 @5xl/coms:grid-cols-5 @7xl/coms:grid-cols-6'>
      {Object.entries(commodities)
        .filter(([mainCategory]) => {
          if (currentCategory === settings.MENU_CATEGORY_ALL) return true
          return mainCategory === currentCategory
        })
        .map(([mainCategory, subCategories], index) => (
          <Fragment key={mainCategory}>
            {currentCategory === settings.MENU_CATEGORY_ALL && (
              <h1
                className={twMerge(
                  'col-span-full -mb-4 indent-[0.05em] text-xl font-bold tracking-wider',
                  index !== 0 && 'mt-4',
                )}
              >
                {mainCategory}
              </h1>
            )}
            {Object.entries(subCategories).map(
              ([subCategory, commoditiesOnMenu]) => (
                <Fragment key={subCategory}>
                  {commoditiesOnMenu.map((commodityOnMenu) => (
                    <CommodityOnMenuCard
                      key={commodityOnMenu.commodity.id}
                      commodityOnMenu={commodityOnMenu}
                      category={subCategory}
                    />
                  ))}
                </Fragment>
              ),
            )}
          </Fragment>
        ))}
    </section>
  )
}
