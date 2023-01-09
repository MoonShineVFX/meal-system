import { useMediaQuery } from 'usehooks-ts'
import { Virtuoso } from 'react-virtuoso'
import { useCallback, useState, useEffect } from 'react'
import { WalletIcon } from '@heroicons/react/24/outline'

import Error from '@/components/core/Error'
import trpc from '@/lib/client/trpc'
import { twData } from '@/lib/common'
import SearchBar from '@/components/core/SearchBar'
import TransactionCard from './TransactionCard'

export default function TransactionList(props: {
  activeTransactionId?: number
  scrollRef?: React.RefObject<HTMLDivElement>
}) {
  const matches = useMediaQuery('(min-width: 576px)') // split wallet and list here
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [checkScrollState, setCheckScrollState] = useState<number>(0) // 0: initial, 1: able to set, 2: set
  const { data, isError, error, isLoading, fetchNextPage, hasNextPage } =
    trpc.transaction.get.useInfiniteQuery(
      { keyword: searchKeyword },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
      },
    )

  // Remember scroll position
  useEffect(() => {
    if (!props.scrollRef?.current) return

    const handleScroll = () => {
      if (!props.activeTransactionId) {
        sessionStorage.setItem(
          'transaction-scroll-position',
          JSON.stringify(props.scrollRef?.current?.scrollTop),
        )
      }
    }

    props.scrollRef.current.addEventListener('scroll', handleScroll)
    return () => {
      props.scrollRef?.current?.removeEventListener('scroll', handleScroll)
    }
  }, [props.scrollRef?.current])

  // Scroll to previous position
  useEffect(() => {
    if (
      !props.scrollRef?.current ||
      props.activeTransactionId ||
      checkScrollState !== 1
    )
      return

    const previousScrollPosition = JSON.parse(
      sessionStorage.getItem('transaction-scroll-position') || '0',
    )
    const scrollRef = props.scrollRef.current

    setTimeout(() => {
      scrollRef.scrollTo({
        top: previousScrollPosition,
        behavior: 'auto',
      })
      setCheckScrollState(2)
    }, 1)
  }, [props.activeTransactionId, checkScrollState, props.scrollRef?.current])

  const handleScrollEndReached = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage])

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
      <SearchBar
        className='p-4 lg:px-8 lg:pb-4  @xl:lg:pt-8'
        placeholder='搜尋交易紀錄'
        isLoading={isLoading}
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
      />
      {/* Empty */}
      {transactions.length === 0 && !isLoading && (
        <div className='flex h-full flex-col items-center justify-center gap-4'>
          <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
            <WalletIcon className='h-12 w-12 text-stone-400' />
          </div>
          <h1 className='indent-[0.1em] text-lg font-bold tracking-widest text-stone-500'>
            {searchKeyword === '' ? `還沒有過交易紀錄` : '找不到符合的結果'}
          </h1>
        </div>
      )}
      {/* List */}
      <Virtuoso
        className='ms-scroll'
        customScrollParent={
          matches ? undefined : props.scrollRef?.current ?? undefined
        }
        endReached={handleScrollEndReached}
        totalListHeightChanged={(height) => {
          if (height > window.innerHeight && checkScrollState === 0)
            setCheckScrollState(1)
        }}
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
          <TransactionCard
            key={transaction?.id ?? index}
            transaction={transaction}
            isLast={index === transactions.length - 1}
            isSelected={transaction?.id === props.activeTransactionId}
          />
        )}
      />
    </div>
  )
}
