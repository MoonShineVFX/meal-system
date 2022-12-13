import type { MenuType } from '@prisma/client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { twMerge } from 'tailwind-merge'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'

import { twData, settings } from '@/lib/common'
import trpc from '@/lib/client/trpc'
import type {
  CommoditiesOnMenu,
  CommoditiesOnMenuByCategory,
} from '@/lib/client/trpc'
import COMsGrid from './COMsGrid'
import COMDialog from './COMDialog'
import { useStore } from '@/lib/client/store'

const categoriesPlaceholder = Array(5).fill('分類')
const CATEGORY_SCROLL_TOP_TRIGGER = 64

export default function Menu(props: {
  type: MenuType
  date?: Date
  className?: string
}) {
  const { data, isLoading, isError, error } = trpc.menu.get.useQuery({
    type: props.type,
    date: props.date,
  })
  const router = useRouter()
  const [selectedCom, setSelectedCom] = useState<CommoditiesOnMenu[0] | null>(
    null,
  )
  const [comsByCategory, setComsByCategory] =
    useState<CommoditiesOnMenuByCategory>(new Map())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const setCurrentMenu = useStore((state) => state.setCurrentMenu)
  const currentCategory = useStore((state) => state.currentCategory)
  const setCurrentCategory = useStore((state) => state.setCurrentCategory)
  const gridRef = useRef<HTMLDivElement>(null)

  const categories = isLoading
    ? categoriesPlaceholder
    : [...comsByCategory.keys()]

  // Detect grid scroll
  useEffect(() => {
    if (!gridRef.current || isLoading) return
    const handleScroll = () => {
      if (!gridRef.current) return

      let topCategory: string | undefined = undefined

      // Detect bottom
      if (
        gridRef.current.scrollHeight - gridRef.current.scrollTop ===
        gridRef.current.clientHeight
      ) {
        topCategory = categories[categories.length - 1]
      } else {
        // Detect distance
        let topDistance = Infinity

        for (const category of categories) {
          const el = document.getElementById(category)
          if (!el) continue
          const topPosition = el.getBoundingClientRect().top
          if (topPosition > CATEGORY_SCROLL_TOP_TRIGGER) continue
          const thisTopDistance = CATEGORY_SCROLL_TOP_TRIGGER - topPosition
          if (thisTopDistance < topDistance) {
            topDistance = thisTopDistance
            topCategory = category
          }
        }
      }

      if (topCategory && topCategory !== currentCategory) {
        setCurrentCategory(topCategory)
      }
    }
    gridRef.current.addEventListener('scroll', handleScroll)
    return () => {
      gridRef.current?.removeEventListener('scroll', handleScroll)
    }
  }, [gridRef, categories, isLoading, currentCategory])

  // Detect commodityId from query and open
  useEffect(() => {
    if (router.query.commodityId && data) {
      const commodityId = Number(router.query.commodityId)
      const com = data.commodities.find(
        (com) => com.commodity.id === commodityId,
      )
      if (com) {
        setSelectedCom(com)
        setIsDialogOpen(true)
      }
    } else if (!router.query.commodityId && isDialogOpen) {
      setIsDialogOpen(false)
    }
  }, [router.query.commodityId, data])

  // On data change
  useEffect(() => {
    if (!data) return

    // Group commodities by category
    const comsByCategory: CommoditiesOnMenuByCategory = new Map()
    for (const com of data.commodities) {
      const categories = com.commodity.categories
      if (categories.length > 0) {
        for (const category of categories) {
          if (!comsByCategory.has(category.mainName)) {
            comsByCategory.set(category.mainName, new Map())
          }
          if (!comsByCategory.get(category.mainName)!.has(category.subName)) {
            comsByCategory.get(category.mainName)!.set(category.subName, [])
          }
          comsByCategory
            .get(category.mainName)!
            .get(category.subName)!
            .push(com)
        }
      } else {
        if (!comsByCategory.has(settings.MENU_CATEGORY_NULL)) {
          comsByCategory.set(
            settings.MENU_CATEGORY_NULL,
            new Map([[settings.MENU_CATEGORY_NULL, []]]),
          )
        }
        comsByCategory
          .get(settings.MENU_CATEGORY_NULL)!
          .get(settings.MENU_CATEGORY_NULL)!
          .push(com)
      }
    }

    const result = new Map(
      [...comsByCategory].sort((a, b) =>
        b[0] === settings.MENU_CATEGORY_NULL
          ? -1
          : a[0] === settings.MENU_CATEGORY_NULL
          ? 1
          : 0,
      ),
    )

    setComsByCategory(result)
    setCurrentMenu(data)
    setCurrentCategory(comsByCategory.keys().next().value)
  }, [data])

  const handleDialogClose = useCallback(() => {
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

  const handleCategoryClick = useCallback((category: string) => {
    document.getElementById(category)?.scrollIntoView({
      behavior: 'smooth',
    })
    return
  }, [])

  if (isError)
    return (
      <div className='grid h-full w-full place-items-center text-red-400'>
        {error.message}
      </div>
    )

  const coms = isLoading ? undefined : comsByCategory

  return (
    <div
      className={twMerge(
        'group/menu relative h-full bg-white',
        props.className,
      )}
      data-ui={twData({ loading: isLoading })}
    >
      <div className='absolute inset-0 flex flex-col lg:flex-row'>
        {/* Categories */}
        <ul className='absolute z-10 flex w-full gap-4 overflow-x-auto bg-white/80 p-4 py-2 shadow backdrop-blur lg:static lg:w-max lg:flex-col lg:p-8 lg:pr-0 lg:shadow-none lg:backdrop-blur-none'>
          {categories.map((mainCategory, index) => (
            <li
              data-ui={twData({
                selected: currentCategory === mainCategory,
              })}
              key={`category-${index}`}
              className='w-fit shrink-0 cursor-pointer rounded-2xl px-2 py-1 text-stone-500 data-selected:pointer-events-none data-selected:bg-yellow-500 data-selected:text-yellow-900 data-not-selected:hover:bg-stone-600/10 data-not-selected:active:bg-stone-600/10 group-data-loading/menu:skeleton lg:data-not-selected:hover:bg-stone-100 lg:data-not-selected:active:bg-stone-100'
              onClick={() => handleCategoryClick(mainCategory)}
            >
              <p className='text-justify indent-[0.1em] text-sm font-bold tracking-widest group-data-loading/menu:text-transparent sm:text-base'>
                {mainCategory}
              </p>
            </li>
          ))}
        </ul>
        {/* Commodities */}
        <section className='relative grow'>
          <div
            ref={gridRef}
            className='absolute inset-0 overflow-y-auto p-4 pt-[3.75rem] sm:pt-[4rem] lg:p-8'
          >
            {data && data.unavailableReasons.length > 0 && (
              <section className='mb-4 flex flex-col gap-1 rounded-md bg-stone-100 p-4 text-stone-500'>
                <div className='flex items-center gap-2'>
                  <ExclamationTriangleIcon className='h-5 w-5 text-yellow-400' />
                  目前無法訂購餐點
                </div>
                <ul className='flex flex-col gap-1 text-stone-400'>
                  {data.unavailableReasons.map((reason) => (
                    <li className='ml-7 text-sm' key={reason}>
                      {reason}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <COMsGrid comsByCategory={coms} />
          </div>
        </section>
      </div>
      {/* Commodity detail */}
      <COMDialog
        isOpen={isDialogOpen}
        com={selectedCom ?? undefined}
        onClose={handleDialogClose}
      />
    </div>
  )
}
