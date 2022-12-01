import { GetServerSideProps } from 'next'
import { twData } from '@/lib/common'
import Link from 'next/link'
import { GroupedVirtuoso } from 'react-virtuoso'
import { CircleStackIcon } from '@heroicons/react/24/outline'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { useRef } from 'react'

import { useStore } from '@/lib/client/store'
import Button from '@/components/Button'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { transactionId } = context.params as { transactionId: string[] }

  return {
    props: {
      transactionId: transactionId
        ? transactionId.length > 0
          ? transactionId[0]
          : undefined
        : undefined,
    },
  }
}

export default function PageTransaction(props: { transactionId?: string }) {
  const user = useStore((state) => state.user)
  const isDetailOpened = props.transactionId !== undefined

  return (
    <div
      className='group grid min-h-full grid-cols-1 lg:grid-cols-2'
      data-ui={twData({ selected: isDetailOpened })}
    >
      {/* Transactions */}
      <section className='flex flex-col group-data-selected:hidden lg:group-data-selected:flex xl:grid xl:grid-cols-[minmax(0,256px)_minmax(0,1fr)] xl:grid-rows-none xl:group-data-selected:grid'>
        {/* Wallet */}
        <div className='flex flex-col gap-4 bg-gray-100 p-4'>
          <div className='grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[1px] bg-gray-300'>
            <div className='flex items-center gap-4 bg-gray-100 p-4'>
              <CircleStackIcon className='h-8 w-8 text-violet-500' />
              <div className='flex flex-col'>
                <h3 className='text-sm font-bold text-gray-500'>福利點數</h3>
                <h1 className='text-2xl font-bold text-gray-700'>
                  {user?.pointBalance}
                </h1>
              </div>
            </div>
            <div className='flex items-center gap-4 bg-gray-100 p-4'>
              <CurrencyDollarIcon className='h-8 w-8 text-violet-500' />
              <div className='flex flex-col'>
                <h3 className='text-sm font-bold text-gray-500'>夢想幣</h3>
                <h1 className='text-2xl font-bold text-gray-700'>
                  ${user?.creditBalance}
                </h1>
              </div>
            </div>
          </div>
          <Button
            className='h-12'
            textClassName='text-lg font-bold'
            text='儲值'
          />
        </div>
        {/* Transactions list */}
        <div className='flex grow flex-col bg-gray-100 pb-16 sm:pb-0'>
          <h1 className='text-xl text-gray-600'>交易紀錄</h1>
          <GroupedVirtuoso
            groupCounts={[100, 100, 100]}
            groupContent={(index) => <div className='py-4'>日期 {index}</div>}
            itemContent={(index) => (
              <Link href={`/transaction/${index}`}>
                <div className='border-b border-gray-300 px-2 py-4'>
                  交易項目 {index}
                </div>
              </Link>
            )}
          />
        </div>
      </section>
      {/* Transaction Detail */}
      <section className='group-data-not-selected:hidden lg:group-data-not-selected:block'>
        <h1 className='text-xl text-gray-600'>
          {props.transactionId
            ? `交易細節 ${props.transactionId}`
            : '請選擇交易紀錄'}
        </h1>
        {props.transactionId && (
          <div className='flex flex-col'>
            {Array.from(Array(10).keys()).map((i) => (
              <div key={i} className='border-b p-2'>
                交易細節{i}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
