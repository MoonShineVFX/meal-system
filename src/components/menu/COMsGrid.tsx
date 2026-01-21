import { Fragment, memo } from 'react'
import { twMerge } from 'tailwind-merge'

import type { CommoditiesOnMenuByCategory } from '@/lib/client/trpc'
import COMCard from './COMCard'
import { settings } from '@/lib/common'

const comsByCategoryPlaceHolder: CommoditiesOnMenuByCategory = new Map([
  [
    'main',
    {
      order: 0,
      subCategories: new Map([
        ['sub', { order: 0, coms: Array(10).fill(undefined) }],
      ]),
    },
  ],
])
const comsByCategoryPlaceHolderReserve: CommoditiesOnMenuByCategory = new Map([
  [
    'main',
    {
      order: 0,
      subCategories: new Map([
        ['sub', { order: 0, coms: Array(3).fill(undefined) }],
      ]),
    },
  ],
])

const TOTAL_FILLER_COUNT = 10

function COMsGrid(props: {
  comsByCategory?: CommoditiesOnMenuByCategory
  fromReserve?: boolean
}) {
  const comsByCategory =
    props.comsByCategory ??
    (props.fromReserve
      ? comsByCategoryPlaceHolderReserve
      : comsByCategoryPlaceHolder)
  const fillerCount = Math.max(TOTAL_FILLER_COUNT - comsByCategory.size)

  // Create new record, key is com id, value is subCategories per com
  const subCategoriesFromComs = new Map<string, string[]>()
  if (props.fromReserve) {
    comsByCategory.forEach((mainCategoryData) => {
      mainCategoryData.subCategories.forEach((subCategoryData, subCategory) => {
        subCategoryData.coms.forEach((com) => {
          if (com) {
            const comId = com.commodity.id.toString()
            if (subCategoriesFromComs.has(comId)) {
              subCategoriesFromComs.get(comId)?.push(subCategory)
            } else {
              subCategoriesFromComs.set(comId, [subCategory])
            }
          }
        })
      })
    })
  }
  const existComIds: number[] = []

  return (
    <section className='grid w-full grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-4 lg:gap-8'>
      {[...comsByCategory].map(([mainCategory, mainCategoryData], index) => (
        <Fragment key={mainCategory}>
          {!props.fromReserve && (
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
                <span className='skeleton rounded-xl'>分類</span>
              )}
            </h1>
          )}
          {[...mainCategoryData.subCategories].map(
            ([subCategory, subCategoryData]) => (
              <Fragment key={subCategory}>
                {subCategoryData.coms
                  .sort((a, b) => {
                    // Sort by name for non-recent purchases
                    if (subCategory !== settings.RECENT_PURCHASE_CATEGORY) {
                      if (a && b) {
                        return a.commodity.name.localeCompare(b.commodity.name)
                      }
                    }

                    // Sort by updatedAt for recent purchases
                    return 0
                  })
                  .map((com, index) => {
                    if (
                      props.fromReserve &&
                      com &&
                      existComIds.includes(com?.commodity.id)
                    ) {
                      return null
                    }
                    if (com) existComIds.push(com?.commodity.id)
                    return (
                      <COMCard
                        key={com?.commodity.id ?? index}
                        com={com}
                        category={
                          props.fromReserve && com
                            ? subCategoriesFromComs
                                .get(com.commodity.id.toString())!
                                .join(' / ')
                            : subCategory
                        }
                      />
                    )
                  })}
              </Fragment>
            ),
          )}
        </Fragment>
      ))}
      {[...Array(fillerCount).keys()].map((index) => (
        <div key={index} />
      ))}
    </section>
  )
}

export default memo(COMsGrid)
