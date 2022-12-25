import { useMemo, useCallback, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline'

import Spinner from '@/components/core/Spinner'
import Image from '@/components/core/Image'
import trpc, { POSDatas } from '@/lib/client/trpc'
import { settings } from '@/lib/common'

const STATUS_NAME_TEXT = [
  '已付款',
  '製作中',
  '已出餐',
  '完成',
  '已取消',
  '取消中',
]
const STATUS_BUTTON_TEXT = ['製作', '出餐', '完成', '', '', '取消']
const STATUS_BACKGROUND_COLOR = [
  '',
  'bg-yellow-400',
  'bg-green-400',
  'bg-stone-100',
  'bg-red-200',
  'bg-red-200',
]

export default function POSCard(props: {
  order: POSDatas[0]
  isArchived?: boolean
}) {
  const { order } = props
  const updateOrderMutation = trpc.pos.update.useMutation()
  const [isCanceling, setIsCanceling] = useState(false)
  const { step, date } = useMemo(() => {
    let result: { step: number; date: Date } | undefined = undefined

    if (order.timeCanceled !== null) {
      result = { step: 4, date: order.timeCanceled }
    } else if (order.timeCompleted !== null) {
      result = { step: 3, date: order.timeCompleted }
    } else if (order.timeDishedUp !== null) {
      result = { step: 2, date: order.timeDishedUp }
    } else if (order.timePreparing !== null) {
      result = { step: 1, date: order.timePreparing }
    } else {
      result = { step: 0, date: order.createdAt }
    }

    if (isCanceling) result.step = 5
    return result
  }, [order, isCanceling])

  const handleStepClick = useCallback(() => {
    switch (step) {
      case 0:
        updateOrderMutation.mutate({
          orderId: order.id,
          status: 'timePreparing',
        })
        break
      case 1:
        updateOrderMutation.mutate({
          orderId: order.id,
          status: 'timeDishedUp',
        })
        break
      case 2:
        updateOrderMutation.mutate({
          orderId: order.id,
          status: 'timeCompleted',
        })
        break
      case 5:
        updateOrderMutation.mutate({
          orderId: order.id,
          status: 'timeCanceled',
        })
      default:
        break
    }
  }, [step])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.3, type: 'spring' }}
      className='relative flex h-max flex-col gap-4 overflow-hidden rounded-2xl border bg-white p-4 shadow-lg sm:min-h-[26rem] lg:p-6'
    >
      {/* Background */}
      <AnimatePresence initial={false}>
        {step !== 0 && (
          <POSBackground key={step} className={STATUS_BACKGROUND_COLOR[step]} />
        )}
      </AnimatePresence>
      {/* Header */}
      <section className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <h1 className='font-bold'>#{order.id}</h1>
          {/* Cancel Button */}
          {!props.isArchived && (
            <button
              className='-m-2 rounded-full p-2 hover:bg-stone-600/10 active:scale-90 active:bg-stone-600/10'
              onClick={() => setIsCanceling((prev) => !prev)}
            >
              {isCanceling ? (
                <ArrowUturnLeftIcon className='h-6 w-6 text-stone-600/60' />
              ) : (
                <XMarkIcon className='h-6 w-6 text-stone-600/60' />
              )}
            </button>
          )}
        </div>
        {/* Metadata */}
        <div className='flex justify-between'>
          {/* User */}
          <div className='flex items-center gap-2'>
            <div className='relative h-6 w-6 overflow-hidden rounded-full'>
              <Image
                alt='profile'
                src={
                  order.user.profileImage
                    ? order.user.profileImage.path
                    : settings.RESOURCE_PROFILE_PLACEHOLDER
                }
                sizes='24px'
              />
            </div>
            <h2 className='text-sm tracking-wider text-stone-600/60'>
              {order.user.name}
            </h2>
          </div>
          {/* Status */}
          <div className='flex flex-col'>
            <AnimatePresence initial={false} mode='popLayout'>
              <motion.p
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.3, type: 'spring', bounce: 0.75 }}
                className='text-right text-sm font-bold tracking-wider text-stone-600/60'
                key={STATUS_NAME_TEXT[step]}
                layout
              >
                {STATUS_NAME_TEXT[step]}
              </motion.p>
            </AnimatePresence>
            <p className='font-mono text-[0.6rem] tracking-wider text-stone-500/50'>
              {date.toLocaleTimeString('zh-TW')}
            </p>
          </div>
        </div>
      </section>
      {/* Items */}
      <section className='flex grow flex-col gap-4'>
        {order.items.map((item) => (
          <div key={item.id} className='flex flex-col gap-1'>
            {/* Name and quantity */}
            <div className='flex justify-between text-lg font-bold tracking-wider'>
              <p>{item.name}</p>
              <p>{`x ${item.quantity}`}</p>
            </div>
            {/* Options */}
            <div className='flex w-3/5 flex-wrap gap-3 text-stone-500'>
              {Object.values(item.options)
                .flatMap((optionValue) =>
                  Array.isArray(optionValue) ? optionValue : [optionValue],
                )
                .map((optionValue) => (
                  <p key={optionValue}>{optionValue}</p>
                ))}
            </div>
          </div>
        ))}
      </section>

      {/* Steps Button */}
      {!props.isArchived && (
        <section className='relative -z-10 flex h-16'>
          <AnimatePresence initial={false}>
            <POSButton
              key={step}
              label={STATUS_BUTTON_TEXT[step]}
              step={step}
              onClick={handleStepClick}
              isLoading={updateOrderMutation.isLoading}
            />
          </AnimatePresence>
        </section>
      )}
    </motion.div>
  )
}

function POSBackground(props: { className?: string }) {
  return (
    <motion.div
      className={twMerge('absolute inset-0 -z-10', props.className)}
      initial={{
        clipPath: 'circle(0% at 50% calc(100% - 3.5rem))',
        opacity: 1,
      }}
      animate={{
        clipPath: 'circle(150% at 50% calc(100% - 3.5rem))',
        opacity: 0.4,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    ></motion.div>
  )
}

function POSButton(props: {
  label: string
  onClick: () => void
  isLoading?: boolean
  step: number
}) {
  return (
    <div
      className={twMerge(
        'absolute inset-0 flex select-none flex-col items-center',
      )}
    >
      {/* Layout */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
        onClick={props.onClick}
        transition={{ duration: 0.3, type: 'spring' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        className='relative flex aspect-square h-full grow items-center justify-center drop-shadow-lg'
      >
        {/* Background */}
        <div
          className={twMerge(
            'pointer-events-none absolute inset-0 -z-10 rounded-full',
            props.step === 0 &&
              'bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-300',
            props.step === 1 &&
              'bg-green-400 hover:bg-green-300 active:bg-green-300',
            props.step === 2 &&
              'bg-stone-100 hover:bg-stone-50 active:bg-stone-50',
            props.step === 5 && 'bg-red-400 hover:bg-red-300 active:bg-red-300',
          )}
        ></div>
        {/* Label */}
        {props.isLoading ? (
          <Spinner className='h-7 w-7' />
        ) : (
          <p
            className={twMerge(
              'indent-[0.05em] text-lg font-bold tracking-wider',
              props.step === 5 && 'text-white',
            )}
          >
            {props.label}
          </p>
        )}
      </motion.button>
    </div>
  )
}
