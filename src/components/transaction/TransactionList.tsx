import Link from 'next/link'
import { GroupedVirtuoso } from 'react-virtuoso'
import { useState, useEffect } from 'react'

export default function TransactionList(props: {
  externalScrollElement?: HTMLElement
}) {
  const [scrollParent, setScrollParent] = useState<HTMLElement>()

  useEffect(() => {
    // set scroll parent dynamically by screen width (iphone5)
    setScrollParent(
      window.innerWidth < 375 ? props.externalScrollElement : undefined,
    )
  }, [props.externalScrollElement])

  return (
    <div className='flex grow flex-col bg-gray-100'>
      <div className='px-4'>
        <h1 className='text-xl text-gray-600'>交易紀錄</h1>
        <div>搜尋</div>
      </div>
      <GroupedVirtuoso
        customScrollParent={scrollParent}
        groupCounts={[100, 100, 100]}
        groupContent={(index) => <div className='py-4'>日期 {index}</div>}
        itemContent={(index) => (
          <Link href={`/transaction/${index}`}>
            <div className='border-b border-gray-300 px-16 py-4'>
              交易項目 {index}
            </div>
          </Link>
        )}
      />
    </div>
  )
}
