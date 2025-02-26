import {
  ChevronRightIcon,
  CircleStackIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import { TransactionType } from '@prisma/client'
import { motion } from 'framer-motion'
import Link from 'next/link'

import { TransactionDatas } from '@/lib/client/trpc'
import { TransactionName, twData } from '@/lib/common'
import { twMerge } from 'tailwind-merge'

const TransactionTypeStyle: Record<TransactionType, string> = {
  [TransactionType.PAYMENT]: 'text-violet-500 bg-violet-50 border-violet-200',
  [TransactionType.REFUND]: 'text-red-400 bg-red-50 border-red-200',
  [TransactionType.RECHARGE]: 'text-green-500 bg-green-50 border-green-200',
  [TransactionType.CANCELED]: 'text-red-400 bg-red-50 border-red-200',
  [TransactionType.TRANSFER]: 'text-violet-500 bg-violet-50 border-violet-200',
  [TransactionType.DEPOSIT]: 'text-green-500 bg-green-50 border-green-200',
  [TransactionType.RECYCLE]: 'text-pink-500 bg-pink-50 border-pink-200',
}

export default function TransactionCard(props: {
  transaction?: TransactionDatas[number]
  isLast?: boolean
  isSelected?: boolean
}) {
  const { transaction } = props
  return (
    <div
      className={twMerge(
        'mx-4 border-b py-1 group-data-loading:pointer-events-none lg:mx-8',
        props.isLast && 'border-none',
      )}
    >
      <Link
        href={{ query: { t: transaction?.id } }}
        shallow
        className='relative flex gap-4 rounded-2xl p-4 data-selected:pointer-events-none hover:bg-stone-50 active:scale-95 active:bg-stone-50'
        {...twData({
          selected: props.isSelected,
        })}
      >
        {/* Selected highlight */}
        {transaction && props.isSelected && (
          <motion.div
            layoutId={`transaction-${transaction.id}`}
            className={twMerge(
              'absolute inset-0 z-[-1] rounded-2xl border',
              transaction && TransactionTypeStyle[transaction.type],
              'border-transparent',
            )}
            transition={{ type: 'spring', duration: 0.3 }}
          ></motion.div>
        )}
        <div className='flex flex-1 flex-col gap-2 lg:gap-4'>
          {/* ID and Date */}
          <div className='flex items-center gap-2'>
            <p className='rounded-xl text-sm font-bold tracking-wider text-stone-500 group-data-loading:skeleton'>
              #{transaction?.id ?? 123}
            </p>
            <p className='whitespace-nowrap rounded-xl font-mono text-sm tracking-wide text-stone-400 group-data-loading:skeleton'>
              {transaction?.createdAt.toLocaleString().replace('午', '午 ') ??
                '2023/1/1 上午 0:00:00'}
            </p>
          </div>
          {/* Content */}
          <div className='flex gap-2'>
            {/* Type */}
            <div className='relative rounded-lg border border-transparent py-1 px-2 group-data-loading:skeleton'>
              {transaction && !props.isSelected && (
                <motion.div
                  layoutId={`transaction-${transaction.id}`}
                  className={twMerge(
                    'absolute inset-0 z-[1] rounded-lg border',
                    transaction && TransactionTypeStyle[transaction.type],
                  )}
                  transition={{ type: 'spring', duration: 0.3 }}
                ></motion.div>
              )}
              <p
                className={twMerge(
                  'relative z-[1] whitespace-nowrap text-sm tracking-widest',
                  transaction && TransactionTypeStyle[transaction.type],
                )}
              >
                {transaction ? TransactionName[transaction.type] : '交易'}
              </p>
            </div>
            <div className='flex-1'></div>
            {/* Currency */}
            <div className='flex items-center gap-1'>
              <CircleStackIcon className='h-4 w-4 shrink-0 text-yellow-500 group-data-loading:skeleton group-data-loading:rounded-full' />
              <p className='rounded-xl font-bold text-stone-500 group-data-loading:skeleton'>
                {transaction?.type === 'PAYMENT' && transaction?.pointAmount > 0
                  ? '-' + transaction?.pointAmount
                  : transaction?.pointAmount ?? 50}
              </p>
            </div>
            <div className='flex items-center gap-1'>
              <CurrencyDollarIcon className='h-4 w-4 shrink-0 text-yellow-500 group-data-loading:skeleton group-data-loading:rounded-full' />
              <p className='rounded-xl font-bold text-stone-500 group-data-loading:skeleton'>
                {transaction?.type === 'PAYMENT' &&
                transaction?.creditAmount > 0
                  ? '-' + transaction?.creditAmount
                  : transaction?.creditAmount ?? 50}
              </p>
            </div>
          </div>
        </div>
        {/* Arrow */}
        <div className='flex translate-x-4 items-center'>
          <ChevronRightIcon className='h-4 w-4 text-stone-400' />
        </div>
      </Link>
    </div>
  )
}
