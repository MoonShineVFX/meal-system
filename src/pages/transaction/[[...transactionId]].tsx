import { GetServerSideProps } from 'next'
import { useRef } from 'react'

import { twData } from '@/lib/common'
import Wallet from '@/components/transaction/Wallet'
import TransactionList from '@/components/transaction/TransactionList'
import TransactionDetail from '@/components/transaction/TransactionDetail'

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
  const isDetailOpened = props.transactionId !== undefined
  const transactionListScrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className='group grid h-full grid-cols-1 @2xl/main:grid-cols-2'
      data-ui={twData({ selected: isDetailOpened })}
    >
      {/* Transaction List */}
      <section className='@container group-data-selected:hidden @2xl/main:group-data-selected:grid'>
        <div className='relative h-full'>
          <div
            ref={transactionListScrollRef} // for iphone 5 width
            className='absolute inset-0 grid grid-rows-[min-content_auto] overflow-y-auto @xl:grid-cols-[minmax(0,256px)_minmax(0,1fr)] @xl:grid-rows-none'
          >
            <Wallet />
            <TransactionList
              externalScrollElement={
                transactionListScrollRef.current ?? undefined
              }
            />
          </div>
        </div>
      </section>
      {/* Transaction Detail */}
      <section className='group-data-not-selected:hidden @2xl/main:group-data-not-selected:block'>
        <TransactionDetail transactionId={props.transactionId} />
      </section>
    </div>
  )
}
