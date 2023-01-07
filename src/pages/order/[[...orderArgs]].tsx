import { useState, useCallback } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { GetServerSideProps } from 'next'
import z from 'zod'

import { InboxIcon } from '@heroicons/react/24/outline'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

import Error from '@/components/core/Error'
import trpc from '@/lib/client/trpc'
import OrderCard from '@/components/order/OrderCard'
import Title from '@/components/core/Title'
import { twData } from '@/lib/common'
import Tab from '@/components/core/Tab'
import SearchBar from '@/components/core/SearchBar'

const TAB_NAMES = ['處理中', '預訂', '已完成', '搜尋'] as const
type TabName = typeof TAB_NAMES[number]
const TAB_PATHS = ['live', 'reservation', 'archived', 'search'] as const
type TabPath = typeof TAB_PATHS[number]
const TAB_LINKS = TAB_PATHS.map((path) => `/order/${path}`)

const orderArgsSchema = z.array(z.string()).min(1).max(2).optional()

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { orderArgs } = context.params as { orderArgs?: string[] }

  const result = orderArgsSchema.safeParse(orderArgs)
  if (!result.success) {
    return {
      notFound: true,
    }
  }

  let tabName: TabName
  let keyword: string = ''

  if (!orderArgs) {
    // for default
    tabName = TAB_NAMES[0]
  } else if (
    // for id specific
    orderArgs[0] === 'id'
  ) {
    if (orderArgs.length == 2 && orderArgs[1].match(/^\d+$/)) {
      tabName = '搜尋'
      keyword = '#' + orderArgs[1]
    } else {
      return {
        notFound: true,
      }
    }
  } else {
    if (orderArgs.length > 1) {
      return {
        notFound: true,
      }
    }
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

  if (isError) {
    return <Error description={error.message} />
  }
  const isSearch = props.tabName === '搜尋'

  const orders = data?.pages.flatMap((page) => page.orders) ?? []

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
                          <div className='flex justify-center bg-white/80 backdrop-blur'>
                            <SearchBar
                              key='searchBar'
                              placeholder='搜尋訂單'
                              searchKeyword={searchKeyword}
                              setSearchKeyword={setSearchKeyword}
                              hint='拿鐵、#123、2023-01-01'
                              isLoading={isLoading}
                              className='w-full max-w-md px-4 pt-[4.25rem] sm:pt-[4.5rem] lg:px-8 lg:pt-8'
                            />
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
