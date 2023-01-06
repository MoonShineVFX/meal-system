import { GetServerSideProps } from 'next'
import { BanknotesIcon } from '@heroicons/react/24/outline'
import z from 'zod'

import { twData } from '@/lib/common'
import Wallet from '@/components/transaction/Wallet'
import TransactionList from '@/components/transaction/TransactionList'
import TransactionDetail from '@/components/transaction/TransactionDetail'
import Title from '@/components/core/Title'

const transactionArgsSchema = z
  .array(z.string().regex(/^\d+$/))
  .length(1)
  .optional()

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { transactionArgs } = context.params as { transactionArgs?: string[] }

  const result = transactionArgsSchema.safeParse(transactionArgs)
  if (!result.success) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      transactionId: transactionArgs ? parseInt(transactionArgs[0]) : undefined,
    },
  }
}

export default function PageTransaction(props: { transactionId?: number }) {
  return (
    <>
      <Title prefix='交易紀錄' />
      <div
        className='group flex h-full'
        {...twData({ selected: !!props.transactionId })}
      >
        {/* Transaction List */}
        <section className='w-full @container group-data-selected:hidden @2xl/main:group-data-selected:grid'>
          <div className='relative h-full'>
            <div className='absolute inset-0 grid grid-rows-[min-content_auto] overflow-y-auto @xl:grid-cols-[minmax(0,max-content)_minmax(0,1fr)] @xl:grid-rows-none'>
              <Wallet />
              <TransactionList activeTransactionId={props.transactionId} />
            </div>
          </div>
        </section>
        {/* Transaction Detail */}
        <section className='relative z-[1] w-full shadow-lg group-data-not-selected:hidden @2xl/main:group-data-not-selected:block'>
          {props.transactionId ? (
            <TransactionDetail transactionId={props.transactionId} />
          ) : (
            <div className='flex h-full flex-col items-center justify-center gap-4'>
              <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
                <BanknotesIcon className='h-12 w-12 text-stone-400' />
              </div>
              <h1 className='indent-[0.1em] text-lg font-bold tracking-widest text-stone-500'>
                請選擇交易紀錄
              </h1>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
