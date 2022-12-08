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
    <div className='grid w-full grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4'>
      {Object.entries(commodities)
        .filter(([mainCategory]) => {
          if (currentCategory === settings.MENU_CATEGORY_ALL) return true
          return mainCategory === currentCategory
        })
        .map(([mainCategory, subCategories], index) => (
          <Fragment key={mainCategory}>
            {currentCategory === settings.MENU_CATEGORY_ALL && (
              <h2
                className={twMerge(
                  'col-span-full text-3xl font-bold',
                  index !== 0 && 'mt-8',
                )}
              >
                {mainCategory}
              </h2>
            )}
            {Object.entries(subCategories).map(
              ([subCategory, commoditiesOnMenu]) => (
                <Fragment key={subCategory}>
                  <h3 className='col-span-full mt-2 text-lg font-bold'>
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
  )
}
