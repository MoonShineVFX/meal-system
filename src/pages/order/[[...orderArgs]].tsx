import { useState, useCallback, startTransition, ChangeEvent } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { GetServerSideProps } from 'next'

import { InboxIcon } from '@heroicons/react/24/outline'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

import Spinner from '@/components/core/Spinner'
import Error from '@/components/core/Error'
import trpc from '@/lib/client/trpc'
import OrderCard from '@/components/order/OrderCard'
import Title from '@/components/core/Title'
import { twData } from '@/lib/common'
import Tab from '@/components/core/Tab'

const TAB_NAMES = ['處理中', '預訂', '已完成', '搜尋'] as const
type TabName = typeof TAB_NAMES[number]
const TAB_PATHS = ['live', 'reservation', 'archived', 'search'] as const
type TabPath = typeof TAB_PATHS[number]
const TAB_LINKS = TAB_PATHS.map((path) => `/order/${path}`)

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { orderArgs } = context.params as { orderArgs?: string[] }

  let tabName: TabName
  let keyword: string = ''

  if (!Array.isArray(orderArgs) || orderArgs.length === 0) {
    // for default
    tabName = TAB_NAMES[0]
  } else if (
    // for id specific
    orderArgs.length >= 2 &&
    orderArgs[0] === 'id' &&
    orderArgs[1].match(/^\d+$/)
  ) {
    tabName = '搜尋'
    keyword = '#' + orderArgs[1]
  } else {
    const foundIndex = TAB_PATHS.indexOf(orderArgs[0] as TabPath)
    if (foundIndex !== -1) {
      tabName = TAB_NAMES[foundIndex]
    } else {
      tabName = TAB_NAMES[0]
    }
  }

  return {
    props: {
      tabName,
      keyword,
    },
  }
}

export default function PageOrder(props: {
  tabName: TabName
  keyword: string
}) {
  const [searchKeyword, setSearchKeyword] = useState<string>(props.keyword)
  const { data, isError, error, isLoading, fetchNextPage, hasNextPage } =
    trpc.order.get.useInfiniteQuery(
      {
        type: TAB_PATHS[TAB_NAMES.indexOf(props.tabName)],
        keyword: props.tabName === '搜尋' ? searchKeyword : undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
      },
    )

  const handleScrollEndReached = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage])

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value
      startTransition(() => {
        // avoid 注音 typing
        if (!text.match(/[\u3105-\u3129\u02CA\u02C7\u02CB\u02D9]/)) {
          setSearchKeyword(text)
        }
      })
    },
    [],
  )

  if (isError) {
    return <Error description={error.message} />
  }
  const isSearch = props.tabName === '搜尋'

  let orders = data?.pages.flatMap((page) => page.orders) ?? []

  return (
    <>
      <Title prefix='訂單' />
      <div
        className='group flex h-full w-full justify-center data-loading:pointer-events-none'
        {...twData({ loading: isLoading })}
      >
        <div className='flex w-full lg:max-w-4xl lg:gap-8'>
          {/* Tab */}
          <Tab
            tabNames={TAB_NAMES}
            currentTabName={props.tabName}
            tabLinks={TAB_LINKS}
            disableLoading={true}
          />
          {/* Content */}
          <div className='relative h-full flex-1'>
            {/* Empty / Orders */}
            {orders.length === 0 && !isLoading && !isSearch ? (
              <div className='flex h-full flex-col items-center justify-center gap-4'>
                <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
                  <InboxIcon className='h-12 w-12 text-stone-400' />
                </div>
                <h1 className='indent-[0.1em] text-lg font-bold tracking-widest text-stone-500'>
                  {`沒有${props.tabName}的訂單`}
                </h1>
              </div>
            ) : (
              <div className='absolute inset-0'>
                {/* Orders */}
                {isSearch ? (
                  <Virtuoso
                    key='search'
                    topItemCount={1}
                    className='ms-scroll'
                    endReached={handleScrollEndReached}
                    data={[
                      'searchBar',
                      ...(orders.length === 0 && searchKeyword !== ''
                        ? ['empty']
                        : orders),
                      ...(hasNextPage ? Array(2).fill(undefined) : []),
                    ]}
                    itemContent={(index, order) =>
                      typeof order === 'string' ? (
                        order === 'searchBar' ? (
                          // Search
                          <div
                            key='searchBar'
                            className='flex flex-col items-center gap-2 bg-white/80 pt-[4.25rem] backdrop-blur sm:pt-[4.5rem] lg:pt-8'
                          >
                            <div className='relative'>
                              <input
                                type='text'
                                className='rounded-2xl border border-stone-300 bg-stone-100 py-2 px-4 focus:outline-yellow-500'
                                placeholder='搜尋訂單'
                                defaultValue={searchKeyword}
                                onChange={handleSearchChange}
                              />
                              <div className='absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 stroke-2 text-stone-400'>
                                {isLoading ? (
                                  <Spinner className='h-full w-full' />
                                ) : (
                                  <MagnifyingGlassIcon className='h-full w-full' />
                                )}
                              </div>
                            </div>
                            <p className='text-xs text-stone-400'>
                              拿鐵、#123、2023-01-01
                            </p>
                          </div>
                        ) : (
                          // Empty search result
                          <div
                            key='empty'
                            className='flex h-[60vh] flex-col items-center justify-center gap-4'
                          >
                            <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
                              <MagnifyingGlassIcon className='h-12 w-12 text-stone-400' />
                            </div>
                            <h1 className='indent-[0.1em] text-lg font-bold tracking-widest text-stone-500'>
                              找不到符合的結果
                            </h1>
                          </div>
                        )
                      ) : (
                        // Order
                        <OrderCard
                          order={order}
                          key={order?.id ?? index}
                          isFirst={index === 0}
                          isLast={index === orders.length}
                          isLoading={order === undefined}
                        />
                      )
                    }
                  />
                ) : (
                  <Virtuoso
                    key='normal'
                    topItemCount={0}
                    className='ms-scroll'
                    endReached={handleScrollEndReached}
                    data={
                      isLoading
                        ? ([...Array(4).fill(undefined)] as undefined[])
                        : hasNextPage
                        ? [
                            ...orders,
                            ...(Array(2).fill(undefined) as undefined[]),
                          ]
                        : orders
                    }
                    itemContent={(index, order) => (
                      // Order
                      <OrderCard
                        order={order}
                        key={order?.id ?? index}
                        isFirst={index === 0}
                        isLast={index === orders.length - 1}
                        isLoading={order === undefined}
                      />
                    )}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
