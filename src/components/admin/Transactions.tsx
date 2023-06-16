import { TransactionType, User } from '@prisma/client'
import { useEffect, useState } from 'react'
import { InView } from 'react-intersection-observer'

import trpc, { TransactionDatas } from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import SearchBar from '@/components/core/SearchBar'
import Table from '@/components/core/Table'
import Spinner from '@/components/core/Spinner'
import { TransactionName, settings } from '@/lib/common'

export default function Transactions() {
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [transactions, setTransactions] = useState<TransactionDatas>([])

  const { data, isError, error, isLoading, fetchNextPage, hasNextPage } =
    trpc.transaction.getListByStaff.useInfiniteQuery(
      { keyword: searchKeyword },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
      },
    )

  useEffect(() => {
    if (data) {
      setTransactions(data.pages.flatMap((page) => page.transactions))
    }
  }, [data])

  if (isError) return <Error description={error.message} />

  return (
    <div className='relative h-full min-h-full w-full'>
      <div className='absolute inset-0 flex flex-col gap-4 p-8'>
        {/* Top */}
        <div className='flex items-center gap-4'>
          <SearchBar
            placeholder='搜尋交易紀錄'
            isLoading={isLoading}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
          />
        </div>
        {/* Table */}
        <Table
          data={transactions}
          columns={[
            {
              name: '編號',
              align: 'left',
              cellClassName: 'text-sm font-mono font-bold',
              render: (transaction) => transaction.id,
            },
            {
              name: '日期',
              align: 'left',
              cellClassName: 'text-sm',
              render: (transaction) => transaction.createdAt.toLocaleString(),
            },
            {
              name: '夢想幣',
              align: 'right',
              render: (transaction) => transaction.creditAmount,
            },
            {
              name: '點數',
              align: 'right',
              render: (transaction) => transaction.pointAmount,
            },
            {
              name: '來源',
              align: 'left',
              render: (transaction) => renderUserName(transaction.sourceUser),
            },
            {
              name: '對象',
              align: 'left',
              render: (transaction) => renderUserName(transaction.targetUser),
            },
            {
              name: '類型',
              align: 'left',
              cellClassName: 'text-sm',
              render: (transaction) => {
                const transactionText = TransactionName[transaction.type]
                switch (transaction.type) {
                  case TransactionType.DEPOSIT:
                    return <p className='text-green-400'>{transactionText}</p>
                  case TransactionType.RECHARGE:
                    return <p className='text-yellow-400'>{transactionText}</p>
                  case TransactionType.CANCELED:
                    return <p className='text-red-300'>{transactionText}</p>
                  case TransactionType.TRANSFER:
                    return <p className='text-blue-400'>{transactionText}</p>
                  default:
                    return transactionText
                }
              },
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

function renderUserName(user: Pick<User, 'id' | 'name'>) {
  if (user.id === settings.SERVER_USER_ID) {
    return <p className='text-sm text-teal-400'>{user.name}</p>
  }
  if (user.id === settings.SERVER_CLIENTORDER_ID) {
    return <p className='text-sm text-blue-400'>{user.name}</p>
  }
  return user.name
}
