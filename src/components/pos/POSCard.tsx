import { useMemo, useCallback } from 'react'
import { twMerge } from 'tailwind-merge'
import { motion, AnimatePresence } from 'framer-motion'

import Spinner from '@/components/core/Spinner'
import Image from '@/components/core/Image'
import trpc, { POSDatas } from '@/lib/client/trpc'
import { settings } from '@/lib/common'

const STATUS_NAME = ['已付款', '製作中', '已出餐', '完成']

export default function POSCard(props: { order: POSDatas[0] }) {
  const { order } = props
  const updateOrderMutation = trpc.pos.update.useMutation()
  const step = useMemo(() => {
    if (order.timeClosed !== null) return 3
    if (order.timeCompleted !== null) return 2
    if (order.timePreparing !== null) return 1
    return 0
  }, [order])

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
          status: 'timeCompleted',
        })
        break
      case 2:
        updateOrderMutation.mutate({ orderId: order.id, status: 'timeClosed' })
        break
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
        {step === 1 && <POSBackground key='1' className='bg-yellow-400' />}
        {step === 2 && <POSBackground key='2' className='bg-green-400' />}
        {step === 3 && <POSBackground key='3' className='bg-stone-100' />}
      </AnimatePresence>
      {/* Header */}
      <section className='flex flex-col'>
        <div className='flex items-center justify-between'>
          <h1 className='font-bold'>#{order.id}</h1>
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
        </div>
        {/* Status */}
        <div className='flex flex-col'>
          <AnimatePresence initial={false} mode='popLayout'>
            <motion.p
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3, type: 'spring', bounce: 0.75 }}
              className='font-bold tracking-wider text-stone-600/60'
              key={STATUS_NAME[step]}
              layout
            >
              {STATUS_NAME[step]}
            </motion.p>
          </AnimatePresence>
          <p className='font-mono text-xs tracking-wider text-stone-500/50'>
            {order.createdAt.toLocaleString('zh-TW')}
          </p>
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
      <section className='relative -z-10 flex h-16'>
        <AnimatePresence initial={false}>
          {step === 0 && (
            <POSButton
              key='0'
              label='製作'
              step={0}
              currentStep={step}
              onClick={handleStepClick}
              isLoading={updateOrderMutation.isLoading}
            />
          )}
          {step === 1 && (
            <POSButton
              key='1'
              label='出餐'
              step={1}
              currentStep={step}
              onClick={handleStepClick}
              isLoading={updateOrderMutation.isLoading}
            />
          )}
          {step === 2 && (
            <POSButton
              key='2'
              label='完成'
              step={2}
              currentStep={step}
              onClick={handleStepClick}
              isLoading={updateOrderMutation.isLoading}
            />
          )}
        </AnimatePresence>
      </section>
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
  currentStep: number
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
          )}
        ></div>
        {/* Label */}
        {props.isLoading ? (
          <Spinner className='h-7 w-7' />
        ) : (
          <p className='text-lg font-bold'>{props.label}</p>
        )}
      </motion.button>
    </div>
  )
}
