import Link from 'next/link'

export default function TransactionDetail(props: { transactionId?: string }) {
  if (!props.transactionId) {
    return <div className='grid h-full place-items-center'>請選擇交易紀錄</div>
  }

  return (
    <div className='flex flex-col'>
      <Link className='lg:hidden' href='/transaction'>
        返回
      </Link>
      {Array.from(Array(10).keys()).map((i) => (
        <div key={i} className='border-b p-2'>
          交易細節{i}
        </div>
      ))}
    </div>
  )
}
