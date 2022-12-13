import { Fragment, memo } from 'react'
import { twMerge } from 'tailwind-merge'

import { settings } from '@/lib/common'
import type { CommoditiesOnMenuByCategory } from '@/lib/client/trpc'
import COMCard from './COMCard'

const comsByCategoryPlaceHolder: CommoditiesOnMenuByCategory = {
  main: {
    sub: Array(10).fill(undefined),
  },
}

const TOTAL_FILLER_COUNT = 10

function COMsGrid(props: {
  currentCategory: string
  comsByCategory?: CommoditiesOnMenuByCategory
}) {
  const { currentCategory } = props

  const comsByCategory = props.comsByCategory ?? comsByCategoryPlaceHolder
  const consByCategoryFiltered = Object.entries(comsByCategory).filter(
    ([mainCategory]) => {
      if (currentCategory === settings.MENU_CATEGORY_ALL) return true
      return mainCategory === currentCategory
    },
  )
  const fillerCount = Math.max(
    TOTAL_FILLER_COUNT - consByCategoryFiltered.length,
  )

  return (
    <section className='grid w-full grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-4 lg:gap-8'>
      {consByCategoryFiltered.map(([mainCategory, subCategories], index) => (
        <Fragment key={mainCategory}>
          {currentCategory === settings.MENU_CATEGORY_ALL && (
            <h1
              className={twMerge(
                'col-span-full indent-[0.05em] text-xl font-bold tracking-wider lg:-mb-4',
                index !== 0 && 'mt-4',
              )}
            >
              {props.comsByCategory ? (
                mainCategory
              ) : (
                <span className='skeleton rounded-md text-transparent'>
                  分類
                </span>
              )}
            </h1>
          )}
          {Object.entries(subCategories).map(([subCategory, coms]) => (
            <Fragment key={subCategory}>
              {coms.map((com, index) => (
                <COMCard
                  key={com?.commodity.id ?? index}
                  com={com}
                  category={subCategory}
                />
              ))}
            </Fragment>
          ))}
        </Fragment>
      ))}
      {Array.from(Array(fillerCount).keys()).map((index) => (
        <div key={index} />
      ))}
    </section>
  )
}

export default memo(COMsGrid)
