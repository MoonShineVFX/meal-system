import trpc from '@/trpc/client/client'
import { Role } from '@prisma/client'
import { Fragment } from 'react'

export default function PageRecords() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.trade.listTransactions.useInfiniteQuery(
      { role: Role.USER },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )

  return (
    <>
      <h1 className="text-3xl text-center">records</h1>
      <div className="flex flex-col items-center mt-8">
        {data?.pages.map((page) => (
          <Fragment key={page.nextCursor}>
            {page.records.map((record) => (
              <div key={record.id} className="flex gap-4 items-center mb-4">
                <h2 className="text-lg bg-teal-800 p-2 rounded-xl">
                  {record.id}
                </h2>
                <div>{record.type}</div>
                <div>{record.currency}</div>
                <div>{record.amount}</div>
              </div>
            ))}
          </Fragment>
        ))}
        {hasNextPage && (
          <button
            className="border-2 p-2 mt-4"
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
