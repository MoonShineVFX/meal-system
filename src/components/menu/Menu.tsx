import type { MenuType } from '@prisma/client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { twMerge } from 'tailwind-merge'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'

import Tab from '@/components/core/Tab'
import Dialog from '@/components/core/Dialog'
import { twData, settings } from '@/lib/common'
import trpc from '@/lib/client/trpc'
import type {
  CommoditiesOnMenu,
  CommoditiesOnMenuByCategory,
} from '@/lib/client/trpc'
import COMsGrid from './COMsGrid'
import COMDialog from './COMDialog'
import { useStore } from '@/lib/client/store'
import Error from '@/components/core/Error'

const categoriesPlaceholder: string[] = Array(5).fill('分類')
const CATEGORY_SCROLL_TOP_TRIGGER = 64
const UNAVAILABLE_CONFIRM_NAME = (menuId: number) =>
  `menuconfirm-unavailable-${menuId}`

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
  const [unavailableNotify, setUnavailableNotify] = useState(false)

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
        gridRef.current.scrollHeight - gridRef.current.scrollTop <=
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
            comsByCategory.set(category.mainName, {
              subCategories: new Map(),
              order: category.mainOrder,
            })
          }
          if (
            !comsByCategory
              .get(category.mainName)!
              .subCategories.has(category.subName)
          ) {
            comsByCategory
              .get(category.mainName)!
              .subCategories.set(category.subName, {
                coms: [],
                order: category.subOrder,
              })
          }
          comsByCategory
            .get(category.mainName)!
            .subCategories.get(category.subName)!
            .coms.push(com)
        }
      } else {
        if (!comsByCategory.has(settings.MENU_CATEGORY_NULL)) {
          comsByCategory.set(settings.MENU_CATEGORY_NULL, {
            subCategories: new Map([
              [settings.MENU_CATEGORY_NULL, { coms: [], order: Infinity }],
            ]),
            order: Infinity,
          })
        }
        comsByCategory
          .get(settings.MENU_CATEGORY_NULL)!
          .subCategories.get(settings.MENU_CATEGORY_NULL)!
          .coms.push(com)
      }
    }

    // Sort categories
    const result = new Map(
      [...comsByCategory]
        .sort((a, b) => a[1].order - b[1].order)
        .map(([mainCategory, mainCategoryData]) => [
          mainCategory,
          {
            order: mainCategoryData.order,
            subCategories: new Map(
              [...mainCategoryData.subCategories].sort(
                (a, b) => a[1].order - b[1].order,
              ),
            ),
          },
        ]),
    )

    setComsByCategory(result)
    setCurrentMenu(data)
    setCurrentCategory(comsByCategory.keys().next().value)

    // if session storage not have confirmed, show notify
    if (!sessionStorage.getItem(UNAVAILABLE_CONFIRM_NAME(data.id))) {
      setUnavailableNotify(data.unavailableReasons.length > 0)
    }
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

  if (isError) return <Error description={error.message} />

  const coms = isLoading ? undefined : comsByCategory

  return (
    <div
      className={twMerge('group relative h-full bg-white', props.className)}
      {...twData({ loading: isLoading })}
    >
      <div className='absolute inset-0 flex flex-col lg:flex-row'>
        {/* Categories */}
        <Tab
          tabNames={categories}
          currentTabName={currentCategory}
          onClick={handleCategoryClick}
        />
        {/* Commodities */}
        <section className='relative grow'>
          <div
            ref={gridRef}
            className='ms-scroll absolute inset-0 overflow-y-auto p-4 pt-[3.75rem] sm:pt-[4rem] lg:p-8'
          >
            {data && data.unavailableReasons.length > 0 && (
              <section className='mb-4 flex flex-col gap-1 rounded-2xl bg-red-50 p-4 text-stone-500'>
                <div className='flex items-center gap-2 text-red-400'>
                  <ExclamationTriangleIcon className='h-5 w-5 text-red-400' />
                  目前無法訂購餐點
                </div>
                <ul className='flex flex-col gap-1 text-stone-400'>
                  {data.unavailableReasons.map((reason) => (
                    <li className='ml-7 text-sm text-red-300' key={reason}>
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
      {/* Warning for unavailables */}
      <Dialog
        open={unavailableNotify}
        onClose={() => {
          sessionStorage.setItem(
            UNAVAILABLE_CONFIRM_NAME(data?.id ?? 0),
            'true',
          )
          setUnavailableNotify(false)
        }}
        title='目前無法訂購餐點'
        content={
          <ul className='flex flex-col gap-1'>
            {data?.unavailableReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        }
      />
    </div>
  )
}
