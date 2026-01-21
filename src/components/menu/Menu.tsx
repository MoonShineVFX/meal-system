import {
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/20/solid'
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import type { MenuType } from '@prisma/client'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import Dialog from '@/components/core/Dialog'
import Error from '@/components/core/Error'
import Tab from '@/components/core/Tab'
import Title from '@/components/core/Title'
import { useStore } from '@/lib/client/store'
import type {
  CommoditiesOnMenu,
  CommoditiesOnMenuByCategory,
} from '@/lib/client/trpc'
import trpc from '@/lib/client/trpc'
import { getMenuName, settings, twData } from '@/lib/common'
import COMDialog from './COMDialog'
import COMsGrid from './COMsGrid'
import { useMenuNavigation } from './menu.navigation'

const categoriesPlaceholder: string[] = Array(5).fill('主分類')
const CATEGORY_SCROLL_TOP_TRIGGER = 64

export default function Menu(props: {
  type?: MenuType
  date?: Date
  menuId?: number
  className?: string
  fromReserve?: boolean
}) {
  const { data, isLoading, isError, error } = trpc.menu.get.useQuery({
    type: props.type,
    menuId: props.menuId,
  })
  const { data: orderRecordsData } = trpc.menu.getOrderRecords.useQuery(
    { menuType: 'LIVE' },
    { enabled: props.type === 'LIVE' },
  )
  const { comId, setComId } = useMenuNavigation()

  const [selectedCom, setSelectedCom] = useState<CommoditiesOnMenu[0] | null>(
    null,
  )
  const [comsByCategory, setComsByCategory] =
    useState<CommoditiesOnMenuByCategory>(new Map())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const {
    setCurrentMenu,
    currentCategory,
    setCurrentCategory,
    unavailableConfirms,
    addUnavailableConfirm,
    removeUnavailableConfirm,
  } = useStore((state) => ({
    setCurrentMenu: state.setCurrentMenu,
    currentCategory: state.currentCategory,
    setCurrentCategory: state.setCurrentCategory,
    unavailableConfirms: state.unavailableConfirms_local,
    addUnavailableConfirm: state.addUnavailableConfirm,
    removeUnavailableConfirm: state.removeUnavailableConfirm,
  }))
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
    if (comId !== null && data) {
      const com = data.commodities.find((com) => com.commodity.id === comId)
      if (com) {
        setSelectedCom(com)
        setIsDialogOpen(true)
      }
    } else if (comId === null && isDialogOpen) {
      setIsDialogOpen(false)
    }
  }, [comId, data])

  // On data change
  useEffect(() => {
    if (!data) return

    // Group commodities by category
    const comsByCategory: CommoditiesOnMenuByCategory = new Map()
    for (const com of data.commodities) {
      const categories = com.commodity.categories
      if (categories.length > 0) {
        for (const category of categories) {
          if (!comsByCategory.has(category.rootCategory.name)) {
            comsByCategory.set(category.rootCategory.name, {
              subCategories: new Map(),
              order: category.rootCategory.order,
            })
          }
          if (
            !comsByCategory
              .get(category.rootCategory.name)!
              .subCategories.has(category.name)
          ) {
            comsByCategory
              .get(category.rootCategory.name)!
              .subCategories.set(category.name, {
                coms: [],
                order: category.order,
              })
          }
          comsByCategory
            .get(category.rootCategory.name)!
            .subCategories.get(category.name)!
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

    // Process recent purchases for LIVE menu
    if (
      props.type === 'LIVE' &&
      orderRecordsData &&
      orderRecordsData.length > 0
    ) {
      // Get available commodity IDs in current menu
      const availableCommodityIds = new Set(
        data.commodities
          .filter((com) => com.unavailableReasons.length === 0)
          .map((com) => com.commodity.id),
      )

      // Filter orderRecords to only show available items and remove duplicates
      const recentComs = orderRecordsData
        .map((record) =>
          data.commodities.find(
            (com) => com.commodity.id === record.commodityId,
          ),
        )
        .filter(
          (com): com is NonNullable<typeof com> =>
            com !== undefined && availableCommodityIds.has(com.commodity.id),
        )
        .slice(0, settings.RECENT_PURCHASE_COUNT)

      // Only show category if > 0 item
      if (recentComs.length > 0) {
        const categoryName = settings.RECENT_PURCHASE_CATEGORY

        comsByCategory.set(categoryName, {
          subCategories: new Map([
            [
              categoryName,
              {
                coms: recentComs,
                order: -1,
              },
            ],
          ]),
          order: -1, // Ensure it appears first
        })
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
    setCurrentCategory([...result.keys()][0])

    // if session storage not have confirmed, show notify
    const idKey = data.id.toString()
    if (data.unavailableReasons.length > 0) {
      if (!unavailableConfirms.includes(idKey)) {
        setUnavailableNotify(true)
      }
    } else {
      removeUnavailableConfirm(idKey)
    }
  }, [data, orderRecordsData])

  // Check is all commodities unavailable
  const isAllComsUnavailable = useMemo(() => {
    if (!data) return false
    return data.commodities.every((com) => com.unavailableReasons.length > 0)
  }, [data])

  const handleDialogClose = useCallback(() => {
    setComId(null)
  }, [setComId])

  const handleCategoryClick = useCallback((category: string) => {
    document.getElementById(category)?.scrollIntoView({
      behavior: 'smooth',
    })
    return
  }, [])

  if (isError) return <Error description={error.message} />

  const coms = isLoading ? undefined : comsByCategory

  return (
    <>
      <Title prefix={getMenuName(data)} />
      <div
        className={twMerge('group relative h-full bg-white', props.className)}
        {...twData({ loading: isLoading })}
      >
        <div className='absolute inset-0 flex flex-col lg:flex-row'>
          {/* Categories */}
          {!props.fromReserve && (
            <Tab
              tabNames={categories}
              currentTabName={currentCategory}
              onClick={handleCategoryClick}
            />
          )}
          {/* Commodities */}
          <section className='relative grow'>
            <div
              ref={gridRef}
              className={twMerge(
                'ms-scroll absolute inset-0 overflow-y-auto p-4 lg:p-8',
                !props.fromReserve && 'pt-[3.75rem] sm:pt-[4rem]', // Padding for categories
              )}
            >
              {/* Header for reservations */}
              {props.fromReserve && (
                <div className='relative mb-4 flex items-start justify-center lg:justify-start'>
                  <div className='absolute inset-y-0 left-0 flex items-center lg:hidden'>
                    <Link
                      href='/reserve'
                      className='-m-2 flex items-center rounded-full p-2 text-stone-400 hover:bg-stone-100 active:scale-90 active:bg-stone-100'
                    >
                      <ArrowUturnLeftIcon className='h-6 w-6' />
                    </Link>
                  </div>
                  <h1
                    className={twMerge(
                      'text-lg font-bold tracking-wider',
                      !data && 'skeleton rounded-xl',
                    )}
                  >
                    {data ? getMenuName(data) : '預訂 X月X日 餐點'}
                  </h1>
                </div>
              )}
              {/* description */}
              {data?.description && props.fromReserve && (
                <h3 className='mb-4 rounded-2xl text-sm text-stone-400'>
                  {data.description}
                </h3>
              )}
              {data?.limitPerUser && data.limitPerUser > 0 ? (
                <div className='mb-4 flex items-center gap-2'>
                  <DocumentArrowUpIcon className='h-4 w-4 text-stone-300' />
                  <p className='text-sm tracking-wider text-stone-500'>
                    <span>{`每人總共限點 ${data.limitPerUser} 份，您還能點 ${data.maxQuantity} 份`}</span>
                  </p>
                </div>
              ) : null}
              {/* Warning */}
              {data &&
                (data.unavailableReasons.length > 0 ||
                  isAllComsUnavailable) && (
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
                      {isAllComsUnavailable && (
                        <li className='ml-7 text-sm text-red-300'>
                          所有餐點皆無法訂購
                        </li>
                      )}
                    </ul>
                  </section>
                )}
              {/* Grid */}
              <COMsGrid comsByCategory={coms} fromReserve={props.fromReserve} />
            </div>
          </section>
        </div>
        {/* Commodity detail */}
        <COMDialog
          isOpen={isDialogOpen}
          com={selectedCom ?? undefined}
          onClose={handleDialogClose}
        />
        {/* Warning for unavailables (Disabled) */}
        {false && (
          <Dialog
            open={unavailableNotify}
            onClose={() => {
              if (data) {
                addUnavailableConfirm(data.id.toString())
              }
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
        )}
      </div>
    </>
  )
}
