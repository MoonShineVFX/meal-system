import { useRouter } from 'next/router'
import { DepositStatus } from '@prisma/client'
import {
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

import trpc from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import { SpinnerBlock } from '@/components/core/Spinner'
import Title from '@/components/core/Title'

export default function PageDepositDetail() {
  const router = useRouter()
  const { depositId, notify } = router.query
  const { data, isError, error, isLoading } = trpc.deposit.get.useQuery({
    id: depositId as string,
    notification: notify === 'true',
  })

  if (isError) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock />

  const isSuccess = data.status === DepositStatus.SUCCESS
  const isPending = data.status === DepositStatus.PENDING

  return (
    <div className='flex h-full w-full flex-col items-center justify-center'>
      <Title prefix={`儲值紀錄 ${depositId}`} />
      <div className='flex flex-col items-center justify-center sm:rounded-2xl sm:border sm:p-8 sm:shadow-lg'>
        <p className='mb-1 font-mono font-bold text-stone-400'>{depositId}</p>
        <p className='mb-4 text-xs text-stone-400'>
          {data.createdAt.toLocaleString()}
        </p>
        {/* deposit status with icon on full page */}
        {isSuccess ? (
          <CheckCircleIcon className='h-16 w-16 text-green-400' />
        ) : isPending ? (
          <InformationCircleIcon className='h-16 w-16 text-yellow-400' />
        ) : (
          <ExclamationCircleIcon className='h-16 w-16 text-red-400' />
        )}
        <h1 className='mt-4 text-2xl font-bold text-gray-800'>
          {isSuccess ? '儲值成功' : isPending ? '等待付款中' : '儲值失敗'}
        </h1>
        <p className='mt-2 mb-8 text-sm text-stone-400 sm:text-base'>
          {isSuccess ? (
            <span className='mb-8'>
              付款已成功到帳，請至{' '}
              <Link
                href={`/transaction/${
                  data.transactions[data.transactions.length - 1].id
                }`}
                className='font-bold text-yellow-500'
              >
                交易紀錄
              </Link>{' '}
              查看。
            </span>
          ) : isPending ? (
            '您的儲值金額尚未到帳，請稍後或聯繫公司財務。'
          ) : (
            '付款手續出現錯誤，如有問題請聯繫公司財務。'
          )}
        </p>
        <p className='text-stone-400'>儲值 {data.amount} 元</p>
      </div>
    </div>
  )
}
