import Link from 'next/link'
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { CircleStackIcon } from '@heroicons/react/24/outline'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { WalletIcon } from '@heroicons/react/24/outline'
import { UserMinusIcon } from '@heroicons/react/24/outline'
import { UserPlusIcon } from '@heroicons/react/24/outline'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { CreditCardIcon } from '@heroicons/react/24/outline'

import Title from '@/components/core/Title'
import trpc from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import { TransactionName, twData } from '@/lib/common'

export default function TransactionDetail(props: { transactionId: number }) {
  const { data, isError, error, isLoading } =
    trpc.transaction.getDetail.useQuery({ id: props.transactionId })

  if (isError) {
    return <Error description={error.message} />
  }

  const orders = data
    ? [
        ...data.ordersForPayment,
        ...(data.orderForCanceled ? [data.orderForCanceled] : []),
      ]
    : []

  return (
    <div
      className='group relative h-full w-full'
      {...twData({ loading: isLoading })}
    >
      <div className='ms-scroll absolute inset-0 overflow-y-auto'>
        <div className='flex min-h-full flex-col p-4 lg:p-8'>
          <Title prefix={`交易紀錄 #${props.transactionId}`} />

          <header className='flex items-center gap-4 border-b pb-4'>
            {/* Back button */}
            <Link
              className='flex w-10 items-center rounded-full p-2 text-stone-400 hover:bg-stone-100 active:scale-90 active:bg-stone-100 lg:hidden'
              href='/transaction'
            >
              <ArrowUturnLeftIcon className='h-6 w-6' />
            </Link>
            {/* Header */}
            <div className='flex flex-col'>
              <h1 className='text-lg font-bold tracking-wider'>{`交易紀錄 #${props.transactionId}`}</h1>
              <p className='rounded-xl text-sm tracking-wider text-stone-500 group-data-loading:skeleton'>
                {data?.createdAt.toLocaleString('zh-TW').replace('午', '午 ') ??
                  '2023/1/1 上午 0:00:00'}
              </p>
            </div>
          </header>
          <dl className='grid grid-cols-[1fr_2fr] items-center border-b py-4'>
            <dt className='flex w-fit items-center rounded-xl text-sm font-bold tracking-widest text-stone-400'>
              <WalletIcon className='mr-2 inline-block h-4 w-4' />
              類型
            </dt>
            <dd className='w-fit rounded-xl group-data-loading:skeleton'>
              {data ? TransactionName[data.type] : '類型'}
            </dd>
          </dl>
          <dl className='grid grid-cols-[1fr_2fr] items-center border-b py-4'>
            <dt className='flex w-fit items-center rounded-xl text-sm font-bold tracking-widest text-stone-400'>
              <UserMinusIcon className='mr-2 inline-block h-4 w-4' />
              來源
            </dt>
            <dd className='w-fit rounded-xl group-data-loading:skeleton'>
              {data?.sourceUser.name ?? '使用者'}
            </dd>
          </dl>
          <dl className='grid grid-cols-[1fr_2fr] items-center border-b py-4'>
            <dt className='flex w-fit items-center rounded-xl text-sm font-bold tracking-widest text-stone-400'>
              <UserPlusIcon className='mr-2 inline-block h-4 w-4' />
              對象
            </dt>
            <dd className='w-fit rounded-xl group-data-loading:skeleton'>
              {data?.targetUser.name ?? '使用者'}
            </dd>
          </dl>
          <dl className='grid grid-cols-[1fr_2fr] items-center border-b py-4'>
            <dt className='flex w-fit items-center rounded-xl text-sm font-bold tracking-widest text-stone-400'>
              <CircleStackIcon className='mr-2 inline-block h-4 w-4' />
              點數
            </dt>
            <dd className='w-fit rounded-xl group-data-loading:skeleton'>
              ${data?.pointAmount ?? 50}
            </dd>
          </dl>
          <dl className='grid grid-cols-[1fr_2fr] items-center border-b py-4 last:border-none'>
            <dt className='flex w-fit items-center rounded-xl text-sm font-bold tracking-widest text-stone-400'>
              <CurrencyDollarIcon className='mr-2 inline-block h-4 w-4' />
              夢想幣
            </dt>
            <dd className='w-fit rounded-xl group-data-loading:skeleton'>
              ${data?.creditAmount ?? 50}
            </dd>
          </dl>
          {orders.length > 0 && (
            <dl className='grid grid-cols-[1fr_2fr] items-baseline border-b py-4 last:border-none'>
              <dt className='flex items-center text-sm font-bold tracking-widest text-stone-400'>
                <DocumentTextIcon className='mr-2 inline-block h-4 w-4' />
                訂單
              </dt>
              <dd>
                <ul className='max-w-xs divide-y rounded-md border'>
                  {orders.map((order) => (
                    <li
                      key={order.id}
                      className='text-sm hover:bg-stone-50 active:scale-[0.98] active:bg-stone-50'
                    >
                      <Link href={`/order/id/${order.id}`} title='前往訂單頁面'>
                        <p className='bg-stone-100 py-1 px-2 text-sm text-stone-500'>
                          #{order.id}
                        </p>
                        <ul className='grid grid-cols-3 p-2 tracking-wider text-stone-400'>
                          {order.items.map((item, index) => (
                            <Fragment key={index}>
                              <span>{item.name}</span>
                              <span className='text-right'>${item.price}</span>
                              <span className='text-right'>
                                x {item.quantity}
                              </span>
                            </Fragment>
                          ))}
                        </ul>
                      </Link>
                    </li>
                  ))}
                </ul>
              </dd>
            </dl>
          )}
          {data && data.deposit && (
            <dl className='grid grid-cols-[1fr_2fr] items-baseline border-b py-4 last:border-none'>
              <dt className='flex items-center text-sm font-bold tracking-widest text-stone-400'>
                <CreditCardIcon className='mr-2 inline-block h-4 w-4' />
                儲值明細
              </dt>
              <dd>
                <ul className='divide-y rounded-md border'>
                  <li className='grid grid-cols-2 p-2 text-sm'>
                    <span className='text-stone-400'>編號</span>
                    <span
                      className='overflow-hidden overflow-ellipsis'
                      title={data.deposit.id}
                    >
                      {data.deposit.id}
                    </span>
                  </li>
                  <li className='grid grid-cols-2 p-2 text-sm'>
                    <span className='text-stone-400'>狀態</span>
                    <span>{data.deposit.status}</span>
                  </li>
                  <li className='grid grid-cols-2 p-2 text-sm'>
                    <span className='text-stone-400'>交易日期</span>
                    <span>
                      {data.deposit.createdAt.toLocaleString('zh-TW')}
                    </span>
                  </li>
                  <li className='grid grid-cols-2 p-2 text-sm'>
                    <span className='text-stone-400'>付款日期</span>
                    <span>
                      {data.deposit.payTime
                        ? data.deposit.payTime.toLocaleString('zh-TW')
                        : '未付款'}
                    </span>
                  </li>
                  <li className='grid grid-cols-2 p-2 text-sm'>
                    <span className='text-stone-400'>付款方式</span>
                    <span
                      className='overflow-hidden overflow-ellipsis'
                      title={data.deposit.paymentType ?? ''}
                    >
                      {data.deposit.paymentType ?? '未付款'}
                    </span>
                  </li>
                </ul>
              </dd>
            </dl>
          )}
        </div>
      </div>
    </div>
  )
}
