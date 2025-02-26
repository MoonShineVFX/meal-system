import { motion } from 'framer-motion'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import Button from '@/components/core/Button'
import Dialog from '@/components/core/Dialog'
import Tooltip from '@/components/core/Tooltip'
import trpc, { OrderDatas } from '@/lib/client/trpc'
import { getMenuName, twData } from '@/lib/common'
import OrderItemList from './OrderItemList'

const ORDER_STEPS = ['付款', '處理中', '可取餐', '完成']
const CANCEL_STEPS = ['付款', '已取消', '']

const SELECT_STEP_DATE = ({
  index,
  isCancel,
  order,
}: {
  index: number
  isCancel: boolean
  order: OrderDatas[0]
}) => {
  if (isCancel) {
    if (index === 0) {
      return order.createdAt
    } else if (index === 1) {
      return order.timeCanceled
    }
  } else if (index === 0) {
    return order.createdAt
  } else if (index === 1) {
    return order.timePreparing
  } else if (index === 2) {
    return order.timeDishedUp
  } else if (index === 3) {
    return order.timeCompleted
  }
  return undefined
}

export default function OrderCard(props: {
  order?: OrderDatas[0]
  isFirst?: boolean
  isLast?: boolean
  isLoading?: boolean
}) {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const updateOrderMutation = trpc.order.update.useMutation()

  const { order } = props
  const isCancel = order?.timeCanceled !== null
  const steps = isCancel ? CANCEL_STEPS : ORDER_STEPS
  const step = isCancel
    ? 1
    : order.timeCompleted
    ? 3
    : order.timeDishedUp
    ? 2
    : order.timePreparing
    ? 1
    : 0

  const progress = step / (steps.length - 1)

  const handleCompleteClick = useCallback(() => {
    if (!order) return

    updateOrderMutation.mutate({ orderId: order.id, type: 'complete' })
  }, [order])

  // split order id to 3 digits
  const orderId = order?.id.toString().slice(-3) ?? 123
  let prefixOrderId = ''
  if (order?.id.toString().length ?? 0 > 3) {
    prefixOrderId = order?.id.toString().slice(0, -3).toString() ?? ''
  }

  return (
    <div
      className={twMerge(
        'relative flex flex-col gap-4 border-b border-stone-200 py-6 px-4 pb-7 lg:gap-6 lg:py-8 lg:px-8 lg:pb-9',
        props.isFirst && 'pt-[4.25rem] sm:pt-[4.5rem]',
        props.isLast && 'border-none',
        props.isLoading && 'group pointer-events-none',
        step === 2 && 'bg-stone-50',
      )}
      {...twData({ loading: props.isLoading })}
    >
      {/* Title */}
      <header className='flex items-center gap-2'>
        {/* Order id and menu name */}
        <Tooltip
          content={
            <p className='text-sm text-stone-600'>餐點標籤只會列印後三碼</p>
          }
        >
          <span className='rounded-xl text-lg font-bold group-data-loading:skeleton'>
            <span className='text-base text-stone-400 group-data-loading:text-transparent'>
              #{prefixOrderId}
            </span>
            {orderId}
          </span>
        </Tooltip>
        <span className='rounded-xl tracking-wider text-stone-400 group-data-loading:skeleton'>
          {order ? getMenuName(order.menu) : '菜單類別'}
        </span>
        {/* Price */}
        <div
          className={twMerge(
            'w-fit rounded-xl font-bold tracking-wider text-yellow-500 group-data-loading:skeleton',
            isCancel && 'text-stone-400',
          )}
        >{`$${
          order
            ? order.items.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0,
              )
            : 100
        }`}</div>
        {/* Client Order */}
        {order?.forClient && (
          <Tooltip
            content={<span className='text-stone-400'>{order.note}</span>}
            disabled={!order.note}
          >
            <span className='rounded-xl bg-stone-100 py-1 px-2 text-sm font-bold tracking-wider text-stone-400 group-data-loading:skeleton'>
              客戶
            </span>
          </Tooltip>
        )}
        {/* Buttons */}
        <div className='flex grow justify-end gap-2 text-sm text-stone-400'>
          {order?.canCancel && (
            <Button
              label='取消'
              isDisabled={updateOrderMutation.isPending}
              isLoading={updateOrderMutation.isPending}
              className='p-2 group-data-loading:skeleton'
              textClassName='text-red-400'
              theme='support'
              title='取消訂單'
              onClick={() => setIsCancelDialogOpen(true)}
            />
          )}
          {order?.paymentTransactionId && !order?.forClient && (
            <Link href={`/transaction?t=${order?.paymentTransactionId ?? 123}`}>
              <Button
                label='付款紀錄'
                className='p-2 group-data-loading:skeleton'
                title='前往付款的交易紀錄'
                theme='support'
              />
            </Link>
          )}
          {order?.canceledTransactionId && (
            <Link
              href={`/transaction?t=${order?.canceledTransactionId ?? 123}`}
            >
              <Button
                label='退款紀錄'
                className='p-2 group-data-loading:skeleton'
                title='前往退款的交易紀錄'
                theme='support'
              />
            </Link>
          )}
          {step === 2 && (
            <Button
              label='完成取餐'
              title='完成取餐，關閉訂單'
              className='p-2 group-data-loading:skeleton'
              theme='main'
              spinnerClassName='w-4 h-4'
              isDisabled={updateOrderMutation.isPending}
              isLoading={updateOrderMutation.isPending}
              onClick={handleCompleteClick}
            />
          )}
        </div>
      </header>
      {/* Items */}
      <OrderItemList orderItems={order?.items} isCancel={isCancel} />
      {/* Progress */}
      <section className='mt-2 mb-12 flex flex-col gap-4 px-5 lg:mb-14'>
        <div className='relative h-1 rounded-full bg-stone-200 lg:h-1.5'>
          <motion.div
            className={twMerge(
              'absolute inset-y-0 left-0 rounded-full bg-yellow-500',
              isCancel && 'bg-stone-400',
            )}
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.15 }}
          ></motion.div>
          {/* Steps */}
          <section className='absolute top-1/2 flex w-full justify-between'>
            {steps.map((name, index) => {
              const thisDate = order
                ? SELECT_STEP_DATE({
                    isCancel,
                    order,
                    index,
                  })
                : new Date('2023-01-01')
              return (
                <div className='group relative' key={index}>
                  <Tooltip
                    content={
                      <p className='select-none whitespace-nowrap text-sm tracking-wider text-stone-400'>
                        {thisDate?.toLocaleString('zh-TW', {
                          dateStyle: 'full',
                          timeStyle: 'short',
                        })}
                      </p>
                    }
                    disabled={!thisDate}
                  >
                    <div className='absolute flex -translate-x-1/2 flex-col items-center gap-2'>
                      {/* Dot */}
                      <motion.div
                        initial={false}
                        className={twMerge(
                          'relative h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-stone-200 transition-colors delay-300 lg:h-3 lg:w-3',
                          index <= step &&
                            (isCancel ? 'bg-stone-400' : 'bg-yellow-500'),
                        )}
                      >
                        {/* Pinging dot */}
                        {!isCancel &&
                          index === step &&
                          index !== 0 &&
                          index !== steps.length - 1 && (
                            <div className='absolute inset-0 animate-ping rounded-full bg-yellow-500'></div>
                          )}
                      </motion.div>
                      {/* Text */}

                      <div className='flex flex-col items-center gap-1'>
                        <span
                          className={twMerge(
                            'relative whitespace-nowrap rounded-xl text-xs tracking-wider group-data-loading:skeleton lg:text-sm',
                            index === step && !isCancel && 'text-yellow-500',
                            index > step && 'text-stone-400',
                          )}
                        >
                          {name}
                        </span>
                        {/* Date */}
                        {thisDate && (
                          <span className='whitespace-nowrap rounded-xl font-mono text-xs text-stone-400 group-data-loading:skeleton'>
                            {thisDate.toLocaleTimeString('zh-TW', {
                              hour12: false,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </Tooltip>
                </div>
              )
            })}
          </section>
        </div>
      </section>
      {order && order.canCancel && (
        <Dialog
          cancel
          cancelText='返回'
          confirmText='確認取消'
          open={isCancelDialogOpen}
          onClose={() => setIsCancelDialogOpen(false)}
          useMutation={trpc.order.update.useMutation}
          mutationOptions={{ orderId: order?.id, type: 'cancel' }}
          title='確認取消訂單？'
          confirmButtonTheme='danger'
          content={
            <>
              <p>
                {`即將取消「編號 #${order?.id} - ${getMenuName(order?.menu)}
              」的訂單，此動作無法復原。`}
              </p>
            </>
          }
        />
      )}
    </div>
  )
}
