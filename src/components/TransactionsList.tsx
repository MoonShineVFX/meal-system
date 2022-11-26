import Link from 'next/link'
import React, { useEffect, useMemo } from 'react'
import { TransactionType } from '@prisma/client'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { Role } from '@prisma/client'
import { GroupedVirtuoso } from 'react-virtuoso'
import { Transition } from '@headlessui/react'

import Spinner from './Spinner'
import trpc from '@/lib/client/trpc'
import { settings, TransactionWithName } from '@/lib/common'
import { useStore } from '@/lib/client/store'
import { useCallback } from 'react'

/* Component */
function TransactionItem(props: {
  transaction: TransactionWithName
  displayRole: Role
}) {
  const { transaction, displayRole } = props

  // Check balance prefix
  const isPositive = [
    TransactionType.RECHARGE as string,
    TransactionType.REFUND as string,
  ].includes(transaction.type as string)
  const balanceState =
    displayRole === Role.STAFF
      ? { prefix: '', style: 'text-amber-600' }
      : isPositive
      ? { prefix: '+', style: 'text-green-500' }
      : { prefix: '-', style: '' }

  // Make description by displayRole
  let description: JSX.Element | null = null
  if (displayRole === Role.USER) {
    description = <div>{settings.TRANSACTION_NAME[transaction.type]}</div>
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
    <div className='flex items-center gap-4 rounded-lg px-4 py-2 hover:bg-stone-200'>
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
        {/* Credit */}
        <div
          data-ui={transaction.creditAmount > 0 ? 'active' : 'not-active'}
          className='flex items-center gap-1 data-not-active:hidden'
        >
          <div
            data-ui={isPositive && 'active'}
            className={`text-2xl font-bold ${balanceState.style}`}
          >
            {balanceState.prefix}
            {transaction.creditAmount}
          </div>
          <div className='text-left text-xs text-stone-500'>元</div>
        </div>
        {/* Point */}
        <div
          data-ui={transaction.pointAmount > 0 ? 'active' : 'not-active'}
          className='flex items-center gap-1 data-not-active:hidden'
        >
          <div
            data-ui={isPositive && 'active'}
            className={`text-2xl font-bold ${balanceState.style}`}
          >
            {balanceState.prefix}
            {transaction.pointAmount}
          </div>
          <div className='text-left text-xs text-stone-500'>點</div>
        </div>
      </div>
    </div>
  )
}

const TransactionItemMemo = React.memo(TransactionItem)

function TransactionList(props: {
  role?: Exclude<Role, 'SERVER'>
  isIndex?: boolean // if index, show more button and first page only
}) {
  const isIndex = props.isIndex ?? false
  const displayRole = props.role ?? Role.USER
  const {
    data: transactionsData,
    hasNextPage,
    isLoading,
    fetchNextPage,
  } = trpc.transaction.list.useInfiniteQuery(
    { role: displayRole },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  )
  const transactions = useStore((state) => state[displayRole])
  const addTransactions = useStore((state) => state.addTransactions)

  const handleEndReached = useCallback(() => {
    if (isLoading || !hasNextPage || transactions.length === 0) return
    fetchNextPage()
  }, [isLoading, fetchNextPage, hasNextPage, transactions])

  const nextPageElement = useMemo<JSX.Element | null>(() => {
    if (hasNextPage) {
      if (isIndex) {
        // show redirect button if index
        return (
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
        return (
          <div className='flex justify-center py-8'>
            <Spinner className='h-6 w-6' />
          </div>
        )
      }
    } else {
      return (
        <div className='py-8 text-center tracking-widest text-stone-400'>
          <p>沒有更多交易紀錄</p>
        </div>
      )
    }
  }, [isIndex, hasNextPage])

  const transactionsGroups = useMemo<{ text: string; count: number }[]>(() => {
    const group: { text: string; count: number }[] = []
    transactions
      .slice(0, isIndex ? settings.TRANSACTIONS_PER_PAGE : transactions.length)
      .forEach((transaction) => {
        const date = transaction.createdAt.toLocaleDateString('zh-TW')
        const index = group.findIndex((item) => item.text === date)
        if (index === -1) {
          group.push({ text: date, count: 1 })
        } else {
          group[index].count += 1
        }
      })
    return group
  }, [transactions])

  useEffect(() => {
    addTransactions(
      displayRole,
      transactionsData?.pages.map((page) => page.transactions).flat() ?? [],
    )
  }, [transactionsData?.pages])

  /* Catch invalid situation */
  if (isLoading)
    return (
      <div className='my-8 flex justify-center'>
        <Spinner className='h-6 w-6' />
      </div>
    )

  const hasTransactions = (transactions?.length ?? 0) > 0
  if (!hasTransactions)
    return (
      <div className='my-8 text-center tracking-widest'>
        <p>還沒有交易紀錄</p>
      </div>
    )

  /* Main render */
  return (
    <GroupedVirtuoso
      endReached={handleEndReached}
      useWindowScroll={true}
      groupCounts={transactionsGroups.map((group) => group.count)}
      groupContent={(index) => (
        <div className='py-4'>
          <div className='ml-3 w-fit rounded-lg bg-stone-200 py-1 px-2 text-lg font-bold tracking-widest'>
            {transactionsGroups[index].text}
          </div>
        </div>
      )}
      itemContent={(index) => (
        <div className='px-2 py-4'>
          <TransactionItemMemo
            transaction={transactions[index]}
            displayRole={displayRole}
          />
        </div>
      )}
      components={{
        Footer: () => (
          <Transition
            appear={true}
            show={true}
            enter='transition-all duration-200'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='transition-opacity duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='pb-8'>{nextPageElement}</div>
          </Transition>
        ),
      }}
    />
  )
}

export default TransactionList
