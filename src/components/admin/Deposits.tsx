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

      if (result.response !== null) {
        showDialog({
          icon: 'info',
          title: `${depositId}`,
          content: (
            <div>
              {Object.entries(result.response.Result).map(([key, value]) =>
                key === 'CheckCode' ? null : (
                  <p key={key}>{`${key}: ${value}`}</p>
                ),
              )}
            </div>
          ),
          onClose: () => setFetchingDepositId(null),
        })
      } else {
        showDialog({
          icon: 'warning',
          title: `${depositId}`,
          content: <p>查無資料</p>,
          onClose: () => setFetchingDepositId(null),
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
              name: '日期',
              align: 'left',
              unhidable: true,
              cellClassName: 'text-sm',
              render: (deposit) => deposit.createdAt.toLocaleString(),
            },
            {
              name: '編號',
              align: 'left',
              cellClassName: 'text-sm font-mono',
              render: (deposit) => deposit.id,
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
              cellClassName: 'text-sm font-bold',
              render: (deposit) =>
                deposit.status === DepositStatus.SUCCESS
                  ? `${deposit.status} (${deposit.paymentType})`
                  : deposit.status,
            },
            {
              name: '動作',
              render: (deposit) => (
                <div className='itemshandleUpdateDeposit-center flex gap-2'>
                  <Button
                    textClassName='px-2 py-1 text-sm'
                    className='disabled:opacity-50'
                    label='更新/詳細'
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
