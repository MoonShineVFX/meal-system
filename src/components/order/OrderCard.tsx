import { twMerge } from 'tailwind-merge'

import { motion } from 'framer-motion'
import { OrderDatas } from '@/lib/client/trpc'
import { getMenuName } from '@/lib/common'
import OrderItemList from './OrderItemList'
import Tooltip from '../core/Tooltip'

const ORDER_STEPS = ['付款', '製作中', '可取餐', '完成']
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

export default function OrderCard(props: { order?: OrderDatas[0] }) {
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

  return (
    <div className='relative flex flex-col gap-4 border-b-4 border-stone-200 py-6 px-4 first:pt-0 last:border-b-0 lg:gap-6 lg:py-8 lg:px-8'>
      {/* Title */}
      <header className='flex items-center gap-2'>
        {/* Order id and menu name */}
        <span className='rounded-xl text-lg font-bold group-data-loading:skeleton'>
          #{order?.id ?? 123}
        </span>
        <span className='rounded-xl tracking-wider text-stone-400 group-data-loading:skeleton'>
          {order ? getMenuName(order.menu) : '菜單類別'}
        </span>
        {/* Price */}
        <span className='flex grow justify-end'>
          <Tooltip
            content={
              <div className='flex w-[6rem] select-none flex-col gap-2 text-sm text-stone-400'>
                <li className='flex justify-between'>
                  <p>福利點數</p>
                  <p className='font-bold'>
                    {order?.paymentTransaction?.pointAmount ?? 0}
                  </p>
                </li>
                <li className='flex justify-between'>
                  <p>夢想幣</p>
                  <p className='font-bold'>
                    {order?.paymentTransaction?.creditAmount ?? 0}
                  </p>
                </li>
              </div>
            }
          >
            <div className='w-fit rounded-xl text-lg font-bold tracking-wider group-data-loading:skeleton'>{`$${
              order
                ? (order.paymentTransaction?.creditAmount ?? 0) +
                  (order.paymentTransaction?.pointAmount ?? 0)
                : 100
            }`}</div>
          </Tooltip>
        </span>
      </header>
      {/* Items */}
      <OrderItemList orderItems={order?.items} />
      {/* Progress */}
      <section className='mt-2 mb-12 flex flex-col gap-4 px-5 lg:mb-14'>
        <div className='relative h-1 rounded-full bg-stone-200 lg:h-1.5'>
          <motion.div
            className={twMerge(
              'absolute inset-y-0 left-0 rounded-full bg-yellow-500',
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
      {isCancel && (
        <div className='pointer-events-none absolute inset-0 bg-white/40 backdrop-grayscale'></div>
      )}
    </div>
  )
}
