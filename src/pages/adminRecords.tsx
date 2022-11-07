import trpc from '@/trpc/client/client'
import { Role } from '@prisma/client'
import { Fragment } from 'react'

export default function PageRecords() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.trade.listTransactions.useInfiniteQuery(
      { role: Role.ADMIN },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    )

  return (
    <>
      <h1 className='text-center text-3xl'>admin records</h1>
      <div className='mt-8 flex flex-col items-center'>
        {data?.pages.map((page) => (
          <Fragment key={page.nextCursor}>
            {page.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className='mb-4 flex items-center gap-4'
              >
                <h2 className='rounded-xl bg-teal-800 p-2 text-lg'>
                  {transaction.id}
                </h2>
                <div>{transaction.sourceUser.name}</div>
                <div>{transaction.type}</div>
                <div>{transaction.currency}</div>
                <div>{transaction.amount}</div>
                <div>{transaction.targetUser.name}</div>
              </div>
            ))}
          </Fragment>
        ))}
        {hasNextPage && (
          <button
            className='mt-4 border-2 p-2'
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            more
          </button>
        )}
      </div>
    </>
  )
}
