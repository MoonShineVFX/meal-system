import Link from 'next/link'

import Title from '@/components/core/Title'
import trpc from '@/lib/client/trpc'
import Error from '@/components/core/Error'

export default function TransactionDetail(props: { transactionId: number }) {
  const { data, isError, error, isLoading } =
    trpc.transaction.getDetail.useQuery({ id: props.transactionId })

  if (isError) {
    return <Error description={error.message} />
  }

  return (
    <div className='flex flex-col p-4 lg:p-8'>
      <Title prefix={`交易紀錄 #${props.transactionId}`} />
      <Link className='lg:hidden' href='/transaction'>
        返回
      </Link>
      <h1>{JSON.stringify(data ?? {})}</h1>
    </div>
  )
}
