import { useEffect, useState } from 'react'
import { InView } from 'react-intersection-observer'

import trpc, { OrderDatas } from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import SearchBar from '@/components/core/SearchBar'
import Table from '@/components/core/Table'
import Spinner from '@/components/core/Spinner'
import { getMenuName } from '@/lib/common'

export default function Orders() {
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [orders, setOrders] = useState<OrderDatas>([])

  const { data, isError, error, isLoading, fetchNextPage, hasNextPage } =
    trpc.order.getList.useInfiniteQuery(
      { keyword: searchKeyword },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
      },
    )

  useEffect(() => {
    if (data) {
      setOrders(data.pages.flatMap((page) => page.orders))
    }
  }, [data])

  if (isError) return <Error description={error.message} />

  return (
    <div className='relative h-full min-h-full w-full'>
      <div className='absolute inset-0 flex flex-col gap-4 p-8'>
        {/* Top */}
        <div className='flex items-center gap-4'>
          <SearchBar
            placeholder='搜尋訂單紀錄'
            isLoading={isLoading}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
          />
        </div>
        {/* Table */}
        <Table
          data={orders}
          columns={[
            {
              name: '編號',
              align: 'left',
              cellClassName: 'text-sm font-mono font-bold',
              render: (order) => order.id,
            },
            {
              name: '日期',
              align: 'left',
              cellClassName: 'text-sm',
              render: (order) => order.createdAt.toLocaleString(),
            },
            {
              name: '使用者',
              align: 'left',
              render: (order) => order.user.name,
            },
            {
              name: '夢想幣',
              align: 'right',
              render: (order) => order.paymentTransaction?.creditAmount ?? 0,
            },
            {
              name: '點數',
              align: 'right',
              render: (order) => order.paymentTransaction?.pointAmount ?? 0,
            },
            {
              name: '菜單',
              align: 'left',
              render: (order) => getMenuName(order.menu) ?? '未知菜單',
            },
            {
              name: '餐點',
              align: 'left',
              cellClassName: 'text-xs',
              render: (order) => {
                const orderItems = order.items.reduce((acc, item) => {
                  if (!(item.name in acc)) {
                    acc[item.name] = 0
                  }
                  acc[item.name] += item.quantity
                  return acc
                }, {} as Record<string, number>)
                return Object.entries(orderItems)
                  .map(([name, quantity]) => `${name} x${quantity}`)
                  .join(', ')
              },
            },
            {
              name: '狀態',
              align: 'left',
              render: (order) => {
                if (order.timeCanceled !== null) {
                  return '已取消'
                } else if (order.timeCompleted !== null) {
                  return '已完成'
                } else if (order.timeDishedUp !== null) {
                  return '已出餐'
                } else if (order.timePreparing !== null) {
                  return '準備中'
                }
                return '已下單'
              },
            },
            {
              name: '備註',
              align: 'left',
              render: (order) => (order.forClient ? '客戶招待' : ''),
            },
          ]}
          footer={
            hasNextPage ? (
              <InView
                as='td'
                onChange={(inView) => {
                  if (inView && hasNextPage) {
                    fetchNextPage()
                  }
                }}
                className='flex items-center gap-2 p-4'
              >
                <Spinner className='h-4 w-4' />
                <p className='tracking-wider text-stone-400'>讀取更多</p>
              </InView>
            ) : undefined
          }
        />
      </div>
    </div>
  )
}
