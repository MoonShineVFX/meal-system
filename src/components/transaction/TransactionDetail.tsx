import Link from 'next/link'

import Title from '@/components/core/Title'

export default function TransactionDetail(props: { transactionId: number }) {
  return (
    <div className='flex flex-col p-4 lg:p-8'>
      <Title prefix={`交易紀錄 #${props.transactionId}`} />
      <Link className='lg:hidden' href='/transaction'>
        返回
      </Link>
      {[...Array(10).keys()].map((i) => (
        <div key={i} className='border-b p-2'>
          交易細節{i}
        </div>
      ))}
    </div>
  )
}
