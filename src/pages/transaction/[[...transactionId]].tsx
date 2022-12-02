import { GetServerSideProps } from 'next'

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

  return (
    <div
      className='group grid h-full grid-cols-1 @md/main:grid-cols-2'
      data-ui={twData({ selected: isDetailOpened })}
    >
      {/* Transaction List */}
      <section className='flex flex-col group-data-selected:hidden lg:group-data-selected:flex xl:grid xl:grid-cols-[minmax(0,256px)_minmax(0,1fr)] xl:group-data-selected:grid'>
        <Wallet />
        <TransactionList />
      </section>
      {/* Transaction Detail */}
      <section className='group-data-not-selected:hidden lg:group-data-not-selected:block'>
        <TransactionDetail transactionId={props.transactionId} />
      </section>
    </div>
  )
}
