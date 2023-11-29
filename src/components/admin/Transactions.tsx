import { TransactionType, User } from '@prisma/client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { InView } from 'react-intersection-observer'
import * as XLSX from 'xlsx'

import trpc, { TransactionDatas } from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import SearchBar from '@/components/core/SearchBar'
import Table from '@/components/core/Table'
import Spinner from '@/components/core/Spinner'
import { TransactionName, settings } from '@/lib/common'
import { DropdownMenu, DropdownMenuItem } from '@/components/core/DropdownMenu'

export default function Transactions() {
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [transactions, setTransactions] = useState<TransactionDatas>([])

  const getMonthlyReportMutation =
    trpc.transaction.getMonthlyReport.useMutation()
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

  const recentSixMonths = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 0; i < 6; i++) {
      months.push(new Date(now.getFullYear(), now.getMonth() - i))
    }
    return months
  }, [])

  const handleGetMonthlyReport = useCallback(async (date: Date) => {
    getMonthlyReportMutation.mutate(
      {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      },
      {
        onSuccess: (data) => {
          // Make xlsx
          const fileType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
          const fileExtension = '.xlsx'
          const workBook = XLSX.utils.book_new()

          // Sheet: Commodity
          const workSheet = XLSX.utils.json_to_sheet(
            data.commoditiesWithStatistics.map((c) => ({
              名稱: c.name,
              銷量: c.quantity ?? 0,
              金額: c.price ?? 0,
            })),
          )
          XLSX.utils.book_append_sheet(workBook, workSheet, '餐點')

          // Sheet: Transaction
          const workSheet2 = XLSX.utils.json_to_sheet(
            data.transactions.map((t) => ({
              類別: TransactionName[t.type],
              數量: t._count._all,
              點數: t._sum.pointAmount,
              夢想幣: t._sum.creditAmount,
            })),
          )
          XLSX.utils.book_append_sheet(workBook, workSheet2, '交易紀錄')

          // Sheet: Client Orders
          const workSheet3 = XLSX.utils.json_to_sheet(
            data.clientOrders.map((o) => ({
              日期: o.createdAt,
              使用者: o.user.name,
              金額: o.paymentTransaction?.creditAmount ?? 0,
              備註: o.note ?? '',
            })),
          )
          XLSX.utils.book_append_sheet(workBook, workSheet3, '客戶招待')

          // Sheet: User Spendings
          const workSheet4 = XLSX.utils.json_to_sheet(
            data.userSpendings.map((u) => ({
              使用者: u.name,
              點數: u.point,
              金額: u.credit,
            })),
          )
          XLSX.utils.book_append_sheet(workBook, workSheet4, '使用者花費')

          // Make file
          const excelBuffer = XLSX.write(workBook, {
            bookType: 'xlsx',
            type: 'array',
          })
          const fileData = new Blob([excelBuffer], { type: fileType })

          // Download file
          const fileName = `${date.getFullYear()}年${
            date.getMonth() + 1
          }月報表 (訂單數${data.ordersCount})`
          const url = window.URL.createObjectURL(fileData)
          const link = document.createElement('a')
          document.body.appendChild(link)
          link.href = url
          link.download = fileName + fileExtension
          link.click()
          document.body.removeChild(link)
        },
      },
    )
  }, [])

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
          <DropdownMenu
            className='ml-auto whitespace-nowrap py-3 text-base font-bold'
            label='下載報表'
          >
            {recentSixMonths.map((d, i) => (
              <DropdownMenuItem
                key={i}
                label={`${d.getFullYear()} 年 ${d.getMonth() + 1} 月`}
                onClick={() => handleGetMonthlyReport(d)}
              />
            ))}
          </DropdownMenu>
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
