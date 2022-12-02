import Link from 'next/link'
import { GroupedVirtuoso } from 'react-virtuoso'

export default function TransactionList() {
  return (
    <div className='flex grow flex-col bg-gray-100 px-4 pb-16 sm:pb-0'>
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
  )
}
