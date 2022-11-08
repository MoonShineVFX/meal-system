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
    <div className='flex flex-col gap-4'>
      {props.transactionsData?.pages.map((page, pageIdx) => {
        if (pageIdx !== 0 && props.isIndex) return null
        return (
          <Fragment key={page.nextCursor}>
            {page.transactions.map((transaction) => {
              let dateDivider: JSX.Element | null = null
              const thisDateString = transaction.createdAt.toLocaleDateString(
                'zh-TW',
                { month: 'short', day: 'numeric' },
              )
              if (
                dateDividerData === undefined ||
                dateDividerData !== thisDateString
              ) {
                /* Date */
                dateDivider = (
                  <div
                    key={thisDateString}
                    data-ui={dateDividerData ? 'active' : 'not-active'}
                    className='ml-3 w-fit rounded-md bg-stone-200 py-1 px-2 text-lg font-bold tracking-widest data-active:mt-4'
                  >
                    {thisDateString}
                  </div>
                )
                dateDividerData = thisDateString
              }
              return (
                <>
                  {dateDivider}
                  <div
                    key={transaction.id}
                    className='flex items-center gap-4 rounded-lg px-4 py-2 hover:bg-stone-200'
                  >
                    <div className='h-2 w-2 rounded-full bg-stone-800'></div>
                    {/* Time */}
                    <div className='flex w-[10ch] flex-col'>
                      <div className='text-base '>
                        {transaction.createdAt.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {/* Type */}
                    <div className=''>
                      {settings.TRANSACTION_NAME[transaction.type]}
                    </div>
                    {/* Balance change */}
                    <div className='flex grow flex-col items-end min-[460px]:flex-row min-[460px]:items-center min-[460px]:gap-3'>
                      <div
                        data-ui={
                          [
                            TransactionType.RECHARGE as string,
                            TransactionType.REFUND as string,
                          ].includes(transaction.type as string) && 'active'
                        }
                        className='grow text-right text-2xl font-bold before:content-["-"] data-active:text-green-500 data-active:before:content-["+"]'
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
            <p className='p-4 tracking-widest'>更多交易紀錄</p>
          </Link>{' '}
        </div>
      )}
    </div>
  )
}
