import Link from 'next/link'
import { Fragment } from 'react'
import { Transaction, TransactionType, CurrencyType } from '@prisma/client'
import { InfiniteData } from '@tanstack/react-query'
import { settings } from '@/utils/settings'

type TransactionsData =
  | InfiniteData<{
      transactions: (Transaction & {
        sourceUser: {
          name: string
        }
        targetUser: {
          name: string
        }
      })[]
      nextCursor: number | undefined
    }>
  | undefined

export default function TransactionList(props: {
  transactionsData: TransactionsData
  isIndex?: boolean // if index, show more button and first page only
  hasNextPage?: boolean
}) {
  const hasTransactions =
    (props.transactionsData?.pages[0].transactions.length ?? 0) > 0

  if (!hasTransactions)
    return (
      <div className='my-8 text-center'>
        <p>還沒有交易紀錄</p>
      </div>
    )

  let dateDividerData: string | undefined = undefined

  return (
    <div className='flex flex-col gap-6'>
      {props.transactionsData?.pages.map((page, pageIdx) => {
        if (pageIdx !== 0 && props.isIndex) return null
        return (
          <Fragment key={page.nextCursor}>
            {page.transactions.map((transaction) => {
              let dateDivider: JSX.Element | null = null
              const thisDateString = transaction.createdAt.toLocaleDateString()
              if (
                dateDividerData === undefined ||
                dateDividerData !== thisDateString
              ) {
                dateDivider = <div key={thisDateString}>{thisDateString}</div>
                dateDividerData = thisDateString
              }
              return (
                <>
                  {dateDivider}
                  <div
                    key={transaction.id}
                    className='flex items-center gap-4 rounded-lg px-4 py-2 hover:bg-gray-200'
                  >
                    <div className='h-2 w-2 rounded-full bg-stone-800'></div>
                    {/* Date */}
                    <div className='flex w-[10ch] flex-col'>
                      <div className='text-lg tracking-widest'>
                        {transaction.createdAt.toLocaleTimeString('zh-TW', {
                          hourCycle: 'h23',
                        })}
                      </div>
                    </div>
                    {/* Type */}
                    <div className=''>
                      {settings.TRANSACTION_NAME[transaction.type]}
                    </div>
                    {/* Balance change */}
                    <div className='flex grow flex-col items-end min-[460px]:flex-row min-[460px]:items-center min-[460px]:gap-2'>
                      <div
                        data-ui={
                          [
                            TransactionType.RECHARGE as string,
                            TransactionType.REFUND as string,
                          ].includes(transaction.type as string) && 'active'
                        }
                        className='grow text-right text-3xl font-bold before:content-["-"] data-active:text-green-500 data-active:before:content-["+"]'
                      >
                        {transaction.amount}
                      </div>
                      <div className='max-w-[8ch] grow text-left text-xs text-stone-500'>
                        {transaction.currency === CurrencyType.CREDIT
                          ? '夢想幣'
                          : '福利點數'}
                      </div>
                    </div>
                  </div>
                </>
              )
            })}
          </Fragment>
        )
      })}
      {props.hasNextPage && props.isIndex && (
        <div className='col-span-full flex justify-center p-8'>
          <Link
            className='rounded-xl bg-stone-800 text-stone-100 hover:bg-amber-900'
            href={'/records'}
          >
            <p className='p-4'>更多交易紀錄</p>
          </Link>{' '}
        </div>
      )}
    </div>
  )
}
