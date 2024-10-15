import { useEffect, useState } from 'react'
import { InView } from 'react-intersection-observer'

import Button from '@/components/core/Button'
import Error from '@/components/core/Error'
import SearchBar from '@/components/core/SearchBar'
import Spinner from '@/components/core/Spinner'
import Table from '@/components/core/Table'
import CheckBox from '@/components/form/base/CheckBox'
import trpc, { OrderDatas } from '@/lib/client/trpc'
import { getMenuName } from '@/lib/common'

export default function Orders() {
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [showClientOrderOnly, setShowClientOrderOnly] = useState<boolean>(false)
  const [orders, setOrders] = useState<OrderDatas>([])

  const { data, isError, error, isLoading, fetchNextPage, hasNextPage } =
    trpc.order.getList.useInfiniteQuery(
      { keyword: searchKeyword, onlyClientOrder: showClientOrderOnly },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
      },
    )

  useEffect(() => {
    if (data) {
      setOrders(
        data.pages.flatMap((page) => page.orders).sort((a, b) => b.id - a.id),
      )
    }
  }, [data])

  if (isError) return <Error description={error.message} />

  return (
    <div className='relative h-full min-h-full w-full'>
      <div className='absolute inset-0 flex flex-col gap-4 p-8'>
        {/* Top */}
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-4'>
            <SearchBar
              placeholder='搜尋訂單紀錄'
              isLoading={isLoading}
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
            />
          </div>
          <label className='mr-auto flex cursor-pointer items-center gap-2'>
            <CheckBox
              checked={showClientOrderOnly}
              onChange={(e) => setShowClientOrderOnly(e.target.checked)}
            />
            <span className='text-sm font-bold text-stone-500'>
              只顯示客戶招待
            </span>
          </label>
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
              cellClassName: 'text-sm',
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
                  return <p className='text-red-300'>取消</p>
                } else if (order.timeCompleted !== null) {
                  return <p className='text-green-400'>完成</p>
                } else if (order.timeDishedUp !== null) {
                  return <p className='text-teal-400'>出餐</p>
                } else if (order.timePreparing !== null) {
                  return <p className='text-blue-400'>準備中</p>
                }
                return '下單'
              },
            },
            {
              name: '動作',
              render: (order) => {
                if (order.timeCanceled !== null || order.timeCompleted !== null)
                  return <></>
                return <CancelButton orderId={order.id} />
              },
            },
            {
              name: '備註',
              align: 'left',
              cellClassName: 'text-sm',
              render: (order) => (
                <p className='flex items-center gap-2'>
                  {order.forClient && (
                    <span className='rounded-lg border border-stone-200 bg-stone-100 p-1 text-stone-400'>
                      客戶招待
                    </span>
                  )}
                  {order.note && <span className='text-xs'>{order.note}</span>}
                </p>
              ),
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
                className='flex items-center gap-2 whitespace-nowrap p-4 pl-16'
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

function CancelButton(props: { orderId: number }) {
  const updateOrderMutation = trpc.pos.update.useMutation()

  return (
    <div className='itemshandleUpdateDeposit-center flex gap-2'>
      <Button
        textClassName='px-3 py-1 text-sm'
        className='disabled:opacity-50 hover:bg-stone-200'
        label={'取消訂單'}
        theme='secondary'
        isLoading={updateOrderMutation.isLoading}
        isDisabled={updateOrderMutation.isLoading}
        onClick={() =>
          updateOrderMutation.mutate({
            orderId: props.orderId,
            status: 'timeCanceled',
          })
        }
      />
    </div>
  )
}
