import { useCallback, useEffect, useState } from 'react'
import { DepositStatus } from '@prisma/client'
import { InView } from 'react-intersection-observer'

import trpc, { DepositDatas } from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import SearchBar from '@/components/core/SearchBar'
import Table from '@/components/core/Table'
import Button from '@/components/core/Button'
import Spinner from '@/components/core/Spinner'
import { useDialog } from '@/components/core/Dialog'

export default function Deposits() {
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [deposits, setDeposits] = useState<DepositDatas>([])
  const [fetchingDepositId, setFetchingDepositId] = useState<string | null>(
    null,
  )
  const context = trpc.useContext()
  const { dialog, showDialog } = useDialog()

  const { data, isError, error, isLoading, fetchNextPage, hasNextPage } =
    trpc.deposit.getList.useInfiniteQuery(
      { keyword: searchKeyword },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
      },
    )

  useEffect(() => {
    if (data) {
      setDeposits(data.pages.flatMap((page) => page.deposits))
    }
  }, [data])

  const handleUpdateDeposit = useCallback(
    async (depositId: string) => {
      setFetchingDepositId(depositId)
      const result = await context.deposit.get.fetch({
        id: depositId,
        notification: false,
      })
      setFetchingDepositId(null)

      if (result.response !== null) {
        showDialog({
          icon: null,
          title: '儲值紀錄',
          content: (
            <div>
              {Object.entries(result.response.Result).map(([key, value]) =>
                key === 'CheckCode' ? null : (
                  <p key={key}>
                    <span className='font-bold'>{`${key}:  `}</span>
                    <span className='font-mono'>{`${value}`}</span>
                  </p>
                ),
              )}
            </div>
          ),
        })
      } else {
        showDialog({
          icon: 'warning',
          title: '儲值紀錄',
          content: <p>查無資料: {depositId}</p>,
        })
      }
    },
    [fetchingDepositId],
  )

  if (isError) return <Error description={error.message} />

  return (
    <div className='relative h-full min-h-full w-full'>
      <div className='absolute inset-0 flex flex-col gap-4 p-8'>
        {/* Top */}
        <div className='flex items-center gap-4'>
          <SearchBar
            placeholder='搜尋儲值紀錄'
            isLoading={isLoading}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
          />
        </div>
        {/* Table */}
        <Table
          data={deposits}
          columns={[
            {
              name: '編號',
              align: 'left',
              cellClassName: 'text-sm font-mono font-bold',
              render: (deposit) => deposit.id,
            },
            {
              name: '日期',
              align: 'left',
              cellClassName: 'text-sm',
              render: (deposit) => deposit.createdAt.toLocaleString(),
            },
            {
              name: '使用者',
              align: 'left',
              render: (deposit) => deposit.user.name,
            },
            {
              name: '金額',
              align: 'right',
              render: (deposit) => deposit.amount,
            },
            {
              name: '狀態',
              align: 'left',
              cellClassName: 'text-xs font-bold',
              render: (deposit) =>
                deposit.status === DepositStatus.SUCCESS ? (
                  <span className='text-green-500'>{`${deposit.status}`}</span>
                ) : (
                  deposit.status
                ),
            },
            {
              name: '動作',
              render: (deposit) => (
                <div className='itemshandleUpdateDeposit-center flex gap-2'>
                  <Button
                    textClassName='px-3 py-1 text-sm'
                    className='disabled:opacity-50 hover:bg-stone-200'
                    label={
                      deposit.status === DepositStatus.SUCCESS ? '詳細' : '更新'
                    }
                    theme='secondary'
                    isLoading={fetchingDepositId === deposit.id}
                    isDisabled={
                      fetchingDepositId !== deposit.id &&
                      fetchingDepositId !== null
                    }
                    onClick={() => handleUpdateDeposit(deposit.id)}
                  />
                </div>
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
                className='flex items-center gap-2 p-4'
              >
                <Spinner className='h-4 w-4' />
                <p className='tracking-wider text-stone-400'>讀取更多</p>
              </InView>
            ) : undefined
          }
        />
      </div>
      {dialog}
    </div>
  )
}
