import { TransactionType } from '@prisma/client'
import Link from 'next/link'
import { Virtuoso } from 'react-virtuoso'
import {
  useCallback,
  useRef,
  ChangeEvent,
  startTransition,
  useState,
} from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { CircleStackIcon } from '@heroicons/react/24/outline'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

import Error from '@/components/core/Error'
import trpc from '@/lib/client/trpc'
import { twMerge } from 'tailwind-merge'
import Spinner from '@/components/core/Spinner'
import { TransactionName, twData } from '@/lib/common'

const TransactionTypeStyle: Record<TransactionType, string> = {
  [TransactionType.PAYMENT]: 'text-violet-500 bg-violet-50 border-violet-200',
  [TransactionType.REFUND]: 'text-red-400 bg-red-50 border-red-200',
  [TransactionType.RECHARGE]: 'text-green-500 bg-green-50 border-green-200',
  [TransactionType.CANCELED]: 'text-red-400 bg-red-50 border-red-200',
  [TransactionType.TRANSFER]: 'text-violet-500 bg-violet-50 border-violet-200',
  [TransactionType.DEPOSIT]: 'text-green-500 bg-green-50 border-green-200',
}

export default function TransactionList(props: {
  activeTransactionId?: number
}) {
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const searchRef = useRef<HTMLInputElement>(null)
  const { data, isError, error, isLoading, fetchNextPage, hasNextPage } =
    trpc.transaction.get.useInfiniteQuery(
      { keyword: searchKeyword },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
      },
    )

  const handleScrollEndReached = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage])

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value
      startTransition(() => {
        // avoid 注音 typing
        if (!text.match(/[\u3105-\u3129\u02CA\u02C7\u02CB\u02D9]/)) {
          setSearchKeyword(text)
        }
      })
    },
    [],
  )

  const handleSearchClear = useCallback(() => {
    setSearchKeyword('')
    if (!searchRef.current) return
    searchRef.current.value = ''
    searchRef.current.focus()
  }, [])

  if (isError) {
    return <Error description={error.message} />
  }

  const transactions = data?.pages.flatMap((page) => page.transactions) ?? []

  return (
    <div
      className='group flex grow flex-col'
      {...twData({ loading: isLoading })}
    >
      {/* Search */}
      <div className='p-4 lg:px-8 lg:pb-4  @xl:lg:pt-8'>
        <div key='searchBar' className='flex flex-col items-center gap-2'>
          <div className='relative'>
            <input
              ref={searchRef}
              type='text'
              className='rounded-2xl border border-stone-300 bg-stone-100 py-2 px-4 focus:outline-yellow-500'
              placeholder='搜尋交易紀錄'
              defaultValue={searchKeyword}
              onChange={handleSearchChange}
            />
            <div className='absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 stroke-2 text-stone-400'>
              {isLoading ? (
                <Spinner className='h-full w-full' />
              ) : searchKeyword.length > 0 ? (
                <XMarkIcon
                  className='h-full w-full cursor-pointer rounded-full hover:scale-125 hover:bg-stone-200 active:scale-95 active:bg-stone-200'
                  onClick={handleSearchClear}
                />
              ) : (
                <MagnifyingGlassIcon className='h-full w-full' />
              )}
            </div>
          </div>
        </div>
      </div>
      {/* List */}
      <Virtuoso
        className='ms-scroll'
        endReached={handleScrollEndReached}
        components={{
          Footer: () => <div className='h-4 lg:h-8'></div>,
        }}
        data={
          isLoading
            ? ([...Array(8).fill(undefined)] as undefined[])
            : hasNextPage
            ? [...transactions, ...(Array(3).fill(undefined) as undefined[])]
            : transactions
        }
        itemContent={(index, transaction) => (
          <div
            className={twMerge(
              'mx-4 border-b py-1 group-data-loading:pointer-events-none lg:mx-8',
              index === transactions.length - 1 && 'border-none',
            )}
          >
            <Link
              href={`/transaction/${transaction?.id}`}
              key={transaction?.id ?? index}
              className='relative flex gap-4 rounded-2xl p-4 data-selected:pointer-events-none hover:bg-stone-50 active:scale-95 active:bg-stone-50'
              {...twData({
                selected: transaction?.id === props.activeTransactionId,
              })}
            >
              {/* Selected highlight */}
              {transaction && transaction.id === props.activeTransactionId && (
                <motion.div
                  layoutId={`transaction-${transaction.id}`}
                  className={twMerge(
                    'absolute inset-0 z-[-1] rounded-2xl border',
                    transaction && TransactionTypeStyle[transaction.type],
                    'border-transparent',
                  )}
                  transition={{ type: 'spring', duration: 0.3 }}
                ></motion.div>
              )}
              <div className='flex flex-1 flex-col gap-2 lg:gap-4'>
                {/* ID and Date */}
                <div className='flex items-center gap-2'>
                  <p className='rounded-xl text-sm font-bold tracking-wider text-stone-500 group-data-loading:skeleton'>
                    #{transaction?.id ?? 123}
                  </p>
                  <p className='whitespace-nowrap rounded-xl font-mono text-xs tracking-wide text-stone-400 group-data-loading:skeleton'>
                    {transaction?.createdAt
                      .toLocaleString()
                      .replace('午', '午 ') ?? '2023/1/1 上午 0:00:00'}
                  </p>
                </div>
                {/* Content */}
                <div className='flex gap-2'>
                  {/* Type */}
                  <div className='relative rounded-lg border border-transparent py-1 px-2 group-data-loading:skeleton'>
                    {transaction &&
                      transaction.id !== props.activeTransactionId && (
                        <motion.div
                          layoutId={`transaction-${transaction.id}`}
                          className={twMerge(
                            'absolute inset-0 z-[1] rounded-lg border',
                            transaction &&
                              TransactionTypeStyle[transaction.type],
                          )}
                          transition={{ type: 'spring', duration: 0.3 }}
                        ></motion.div>
                      )}
                    <p
                      className={twMerge(
                        'relative z-[1] whitespace-nowrap text-sm tracking-widest',
                        transaction && TransactionTypeStyle[transaction.type],
                      )}
                    >
                      {transaction ? TransactionName[transaction.type] : '交易'}
                    </p>
                  </div>
                  <div className='flex-1'></div>
                  {/* Currency */}
                  <div className='flex items-center gap-1'>
                    <CircleStackIcon className='h-4 w-4 shrink-0 text-yellow-500 group-data-loading:skeleton group-data-loading:rounded-full' />
                    <p className='rounded-xl font-bold text-stone-500 group-data-loading:skeleton'>
                      {transaction?.type === 'PAYMENT' &&
                      transaction?.pointAmount > 0
                        ? '-' + transaction?.pointAmount
                        : transaction?.pointAmount ?? 50}
                    </p>
                  </div>
                  <div className='flex items-center gap-1'>
                    <CurrencyDollarIcon className='h-4 w-4 shrink-0 text-yellow-500 group-data-loading:skeleton group-data-loading:rounded-full' />
                    <p className='rounded-xl font-bold text-stone-500 group-data-loading:skeleton'>
                      {transaction?.type === 'PAYMENT' &&
                      transaction?.creditAmount > 0
                        ? '-' + transaction?.creditAmount
                        : transaction?.creditAmount ?? 50}
                    </p>
                  </div>
                </div>
              </div>
              {/* Arrow */}
              <div className='flex items-center'>
                <ChevronRightIcon className='h-4 w-4 text-stone-400' />
              </div>
            </Link>
          </div>
        )}
      />
    </div>
  )
}
