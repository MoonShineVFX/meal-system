import { useState } from 'react'
import { DepositStatus } from '@prisma/client'

import trpc from '@/lib/client/trpc'
import { SpinnerBlock } from '@/components/core/Spinner'
import Error from '@/components/core/Error'
import SearchBar from '@/components/core/SearchBar'
import Table from '@/components/core/Table'
import Button from '@/components/core/Button'

export default function Deposits() {
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  // fetchNextPage, hasNextPage
  const { data, isError, error, isLoading } =
    trpc.deposit.getList.useInfiniteQuery(
      { keyword: searchKeyword },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
      },
    )

  if (isError) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock />

  const deposits = data.pages.flatMap((page) => page.deposits)

  return (
    <div className='relative h-full min-h-full w-full'>
      <div className='absolute inset-0 flex flex-col gap-4 p-8'>
        {/* Top */}
        <div className='flex items-center gap-4'>
          <SearchBar
            placeholder='搜尋儲值紀錄'
            isLoading={false}
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
              cellClassName: 'text-sm',
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
                <div className='flex items-center gap-2'>
                  <Button textClassName='p-1 text-sm' label='更新' />
                  <Button textClassName='p-1 text-sm' label='詳細' />
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
