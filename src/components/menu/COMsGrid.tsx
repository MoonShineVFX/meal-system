import { Fragment } from 'react'
import { twMerge } from 'tailwind-merge'

import { settings } from '@/lib/common'
import type { CommoditiesOnMenuByCategory } from '@/lib/client/trpc'
import COMCard from './COMCard'

export default function COMsGrid(props: {
  currentCategory: string
  comsByCategory: CommoditiesOnMenuByCategory
}) {
  const { currentCategory, comsByCategory: commodities } = props

  return (
    <section className='grid w-full grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 @2xl/coms:grid-cols-4 @5xl/coms:grid-cols-5 @7xl/coms:grid-cols-6 lg:gap-8'>
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
                  'col-span-full indent-[0.05em] text-xl font-bold tracking-wider lg:-mb-4',
                  index !== 0 && 'mt-4',
                )}
              >
                {mainCategory}
              </h1>
            )}
            {Object.entries(subCategories).map(([subCategory, coms]) => (
              <Fragment key={subCategory}>
                {coms.map((com) => (
                  <COMCard
                    key={com.commodity.id}
                    com={com}
                    category={subCategory}
                  />
                ))}
              </Fragment>
            ))}
          </Fragment>
        ))}
    </section>
  )
}
