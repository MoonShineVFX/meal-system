import { Fragment, memo } from 'react'
import { twMerge } from 'tailwind-merge'

import type { CommoditiesOnMenuByCategory } from '@/lib/client/trpc'
import COMCard from './COMCard'

const comsByCategoryPlaceHolder: CommoditiesOnMenuByCategory = new Map([
  ['main', new Map([['sub', Array(10).fill(undefined)]])],
])

const TOTAL_FILLER_COUNT = 10

function COMsGrid(props: { comsByCategory?: CommoditiesOnMenuByCategory }) {
  const comsByCategory = props.comsByCategory ?? comsByCategoryPlaceHolder
  const fillerCount = Math.max(TOTAL_FILLER_COUNT - comsByCategory.size)

  return (
    <section className='grid w-full grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-4 lg:gap-8'>
      {[...comsByCategory].map(([mainCategory, subCategories], index) => (
        <Fragment key={mainCategory}>
          <h1
            id={mainCategory}
            className={twMerge(
              'col-span-full scroll-mt-16 text-xl font-bold tracking-wider lg:-mb-4 lg:scroll-mt-8',
              index !== 0 && 'mt-4',
            )}
          >
            {props.comsByCategory ? (
              mainCategory
            ) : (
              <span className='skeleton rounded-md text-transparent'>分類</span>
            )}
          </h1>
          {[...subCategories].map(([subCategory, coms]) => (
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
      {[...Array(fillerCount).keys()].map((index) => (
        <div key={index} />
      ))}
    </section>
  )
}

export default memo(COMsGrid)
