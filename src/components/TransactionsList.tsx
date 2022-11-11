import Link from 'next/link'
import { Fragment, useEffect } from 'react'
import { TransactionType } from '@prisma/client'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useInView } from 'react-intersection-observer'

import Spinner from './Spinner'
import trpc from '@/trpc/client/client'
import { settings } from '@/utils/settings'
import { Role } from '@prisma/client'

export default function TransactionList(props: {
  role?: Role
  isIndex?: boolean // if index, show more button and first page only
}) {
  const displayRole = props.role ?? Role.USER
  const {
    data: transactionsData,
    hasNextPage,
    isLoading,
    fetchNextPage,
  } = trpc.trade.listTransactions.useInfiniteQuery(
    { role: displayRole },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  )
  const { ref, inView } = useInView({ rootMargin: '0px 0px 50% 0px' })

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView])

  if (isLoading)
    return (
      <div className='my-8 flex justify-center'>
        <Spinner className='h-6 w-6' />
      </div>
    )

  const hasTransactions =
    (transactionsData?.pages[0].transactions.length ?? 0) > 0
  if (!hasTransactions)
    return (
      <div className='my-8 text-center tracking-widest'>
        <p>還沒有交易紀錄</p>
      </div>
    )

  let dateDividerData: string | undefined = undefined
  let nextPageElement: JSX.Element | null = null

  if (hasNextPage) {
    if (props.isIndex) {
      // show redirect button if index
      nextPageElement = (
        <div className='col-span-full flex justify-center p-8'>
          <Link
            className='select-none rounded-xl bg-stone-800 text-stone-100 hover:bg-amber-900 active:bg-amber-900'
            href={'/transactions'}
          >
            <p className='p-4 tracking-widest'>更多交易紀錄</p>
          </Link>
        </div>
      )
    } else {
      // show nextpage loading
      nextPageElement = (
        <div ref={ref} className='my-8 flex justify-center'>
          <Spinner className='h-6 w-6' />
        </div>
      )
    }
  } else {
    nextPageElement = (
      <div className='my-8 text-center tracking-widest text-stone-400'>
        <p>沒有更多交易紀錄</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-3'>
      {transactionsData?.pages.map((page, pageIdx) => {
        if (pageIdx !== 0 && props.isIndex) return null
        return (
          <Fragment key={page.nextCursor ?? 'none-cursor'}>
            {page.transactions.map((transaction) => {
              // Check if date divider is needed
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
                    data-ui={dateDividerData ? 'active' : 'not-active'}
                    className='ml-3 w-fit rounded-lg bg-stone-200 py-1 px-2 text-lg font-bold tracking-widest data-active:mt-4'
                  >
                    {thisDateString}
                  </div>
                )
                dateDividerData = thisDateString
              }

              // Check balance prefix
              const isPositive = [
                TransactionType.RECHARGE as string,
                TransactionType.REFUND as string,
              ].includes(transaction.type as string)
              const balanceState =
                displayRole === 'STAFF'
                  ? { prefix: '', style: 'text-amber-600' }
                  : isPositive
                  ? { prefix: '+', style: 'text-green-500' }
                  : { prefix: '-', style: '' }

              // Make description by displayRole
              let description: JSX.Element | null = null
              if (displayRole === Role.USER) {
                description = (
                  <div>{settings.TRANSACTION_NAME[transaction.type]}</div>
                )
              } else if (displayRole === Role.STAFF) {
                description = <div>{transaction.sourceUser.name}</div>
              } else {
                description = (
                  <div className='flex items-center gap-4 xs:gap-6'>
                    <div className='flex flex-col items-center text-stone-500 xs:flex-row xs:gap-2'>
                      <p className='text-xs'>{transaction.sourceUser.name}</p>
                      <ChevronDownIcon className='w-3 text-stone-800 xs:-rotate-90' />
                      <p className='text-xs'>{transaction.targetUser.name}</p>
                    </div>
                    <p>{settings.TRANSACTION_NAME[transaction.type]}</p>
                  </div>
                )
              }

              return (
                <Fragment key={transaction.id}>
                  {dateDivider}
                  <div className='flex items-center gap-4 rounded-lg px-4 py-2 hover:bg-stone-200'>
                    <div className='h-2 w-2 rounded-full bg-stone-800'></div>
                    {/* Time */}
                    <div className='flex w-[8ch] flex-col'>
                      <div className='text-base '>
                        {transaction.createdAt.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {/* Description */}
                    {description}
                    {/* Balance change */}
                    <div className='flex grow flex-col items-end'>
                      {/* Credits */}
                      <div
                        data-ui={
                          transaction.creditsAmount > 0
                            ? 'active'
                            : 'not-active'
                        }
                        className='flex items-center gap-1 data-not-active:hidden'
                      >
                        <div
                          data-ui={isPositive && 'active'}
                          className={`text-2xl font-bold ${balanceState.style}`}
                        >
                          {balanceState.prefix}
                          {transaction.creditsAmount}
                        </div>
                        <div className='text-left text-xs text-stone-500'>
                          元
                        </div>
                      </div>
                      {/* Points */}
                      <div
                        data-ui={
                          transaction.pointsAmount > 0 ? 'active' : 'not-active'
                        }
                        className='flex items-center gap-1 data-not-active:hidden'
                      >
                        <div
                          data-ui={isPositive && 'active'}
                          className={`text-2xl font-bold ${balanceState.style}`}
                        >
                          {balanceState.prefix}
                          {transaction.pointsAmount}
                        </div>
                        <div className='text-left text-xs text-stone-500'>
                          點
                        </div>
                      </div>
                    </div>
                  </div>
                </Fragment>
              )
            })}
          </Fragment>
        )
      })}
      {nextPageElement}
    </div>
  )
}
