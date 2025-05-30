import {
  ArrowUturnLeftIcon,
  PrinterIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import Spinner from '@/components/core/Spinner'
import { print } from '@/lib/client/printer'
import { NotificationType, useStore } from '@/lib/client/store'
import { OrderTimeStatus } from '@/lib/common'

const STATUS_BUTTON_TEXT = ['製作', '出餐', '完成', '', '', '取消']
const STATUS_BACKGROUND_COLOR = [
  '',
  'bg-yellow-400',
  'bg-green-400',
  'bg-stone-100',
  'bg-red-200',
  'bg-red-200',
]
const STATUS_NAME_TEXT = [
  '已付款',
  '處理中',
  '已出餐',
  '完成',
  '已取消',
  '取消中',
]

const POSMotionProperties = {
  layout: true,
  transition: { duration: 0.3, type: 'spring', layout: { type: 'tween' } },
}

const statusVariants = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
}

export default function POSCard(props: {
  order?: Record<OrderTimeStatus, Date | null> & { createdAt?: Date }
  header?: JSX.Element | string
  metadata?: JSX.Element | JSX.Element[]
  children?:
    | JSX.Element
    | JSX.Element[]
    | ((props: { step: number; date?: Date }) => JSX.Element)
  disableAnimation?: boolean
  disableInteraction?: boolean
  disableStatusButton?: boolean
  onStatusModify: (status: OrderTimeStatus) => void
  isLoading?: boolean
  print?: Omit<Parameters<typeof print>[0], 'onSuccess' | 'onError'>
}) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [isPreparingPressed, setIsPreparingPressed] = useState(false)
  const motionProperties = useMemo(() => {
    if (props.disableAnimation) return {}
    return POSMotionProperties
  }, [props.disableAnimation])
  const [isCanceling, setIsCanceling] = useState(false)
  const addNotification = useStore((state) => state.addNotification)
  const printerAPI_local = useStore((state) => state.printerAPI_local)
  const { order } = props
  const { step, date } = useMemo(() => {
    let result: { step: number; date?: Date } | undefined = undefined

    if (order === undefined) return { step: 0, date: new Date('2023-01-01') }

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
    if (!order) return

    switch (step) {
      case 0:
        setIsPreparingPressed(true)
        props.onStatusModify('timePreparing')
        break
      case 1:
        props.onStatusModify('timeDishedUp')
        break
      case 2:
        props.onStatusModify('timeCompleted')
        break
      case 5:
        props.onStatusModify('timeCanceled')
      default:
        break
    }
  }, [step])

  const handlePrintClick = useCallback(() => {
    if (!props.print) return
    setIsPrinting(true)

    print({
      ...props.print!,
      onSuccess: () => {
        setIsPrinting(false)
      },
      onError: (error) => {
        addNotification({
          type: NotificationType.ERROR,
          message: `列印失敗: ${error.message}`,
        })
        setIsPrinting(false)
      },
      apiUrl: printerAPI_local.enabled ? printerAPI_local.url : undefined,
    })
  }, [props.print])

  useEffect(() => {
    if (isPreparingPressed && order?.timePreparing !== null && props.print) {
      handlePrintClick()
      setIsPreparingPressed(false)
    }
  }, [order?.timePreparing])

  return (
    <motion.div
      className='relative z-[1] flex h-max flex-col gap-4 overflow-hidden rounded-2xl border bg-white p-4 shadow-lg sm:min-h-[26rem] lg:p-6'
      {...motionProperties}
    >
      {/* Background */}
      <AnimatePresence initial={false}>
        {step !== 0 && (
          <POSBackground key={step} className={STATUS_BACKGROUND_COLOR[step]} />
        )}
      </AnimatePresence>
      {/* Header */}
      <div className='flex items-center'>
        <h1 className='mr-auto rounded-xl font-bold tracking-wider group-data-loading:skeleton'>
          {props.header}
        </h1>
        {/* Printer Button */}
        {props.print && step < 3 && (
          <button
            className={twMerge(
              '-m-2 mr-2 rounded-full p-2 group-data-loading:hidden hover:bg-stone-600/10 active:scale-90 active:bg-stone-600/10',
              isPrinting && 'pointer-events-none',
            )}
            onClick={handlePrintClick}
            title={'列印'}
          >
            {isPrinting ? (
              <Spinner className='h-6 w-6 p-0.5' />
            ) : (
              <PrinterIcon className='h-6 w-6 p-0.5 text-stone-600/60' />
            )}
          </button>
        )}
        {/* Cancel Button */}
        {!props.disableInteraction && step !== 3 && (
          <button
            className='-m-2 rounded-full p-2 group-data-loading:hidden hover:bg-stone-600/10 active:scale-90 active:bg-stone-600/10'
            onClick={() => setIsCanceling((prev) => !prev)}
            title={isCanceling ? '返回' : '取消訂單'}
          >
            {isCanceling ? (
              <ArrowUturnLeftIcon className='h-6 w-6 p-0.5 text-stone-600/60' />
            ) : (
              <TrashIcon className='h-6 w-6 p-0.5 text-stone-600/60' />
            )}
          </button>
        )}
      </div>
      {/* Metadata */}
      <section className='flex justify-between'>
        {props.metadata}
        {/* Status */}
        <div className='flex flex-col items-end'>
          <AnimatePresence initial={false} mode='popLayout'>
            <motion.p
              variants={statusVariants}
              initial='initial'
              animate='animate'
              exit='exit'
              transition={{ duration: 0.1, type: 'easeIn' }}
              className='rounded-xl text-sm font-bold tracking-wider text-stone-600/60 group-data-loading:skeleton'
              key={STATUS_NAME_TEXT[step]}
            >
              {STATUS_NAME_TEXT[step]}
            </motion.p>
          </AnimatePresence>
          <p className='whitespace-nowrap rounded-xl font-mono text-[0.6rem] tracking-wider text-stone-500/50 group-data-loading:skeleton'>
            {date?.toLocaleTimeString('zh-TW') ?? '　'}
          </p>
        </div>
      </section>
      {/* Content */}
      {props.children instanceof Function
        ? props.children({ step, date })
        : props.children}
      {/* Steps Button */}
      {/* step 5 for canceling command */}
      {((!props.disableInteraction && !props.disableStatusButton) ||
        step === 5) && (
        <section className='z-1 relative flex h-16'>
          <AnimatePresence initial={false}>
            <POSButton
              key={step}
              label={STATUS_BUTTON_TEXT[step]}
              step={step}
              onClick={handleStepClick}
              isLoading={props.isLoading}
            />
          </AnimatePresence>
        </section>
      )}
    </motion.div>
  )
}

const backgroundVariants = {
  initial: {
    clipPath: 'circle(0% at 50% calc(100% - 3.5rem))',
    opacity: 1,
  },
  animate: {
    clipPath: 'circle(150% at 50% calc(100% - 3.5rem))',
    opacity: 0.4,
  },
  exit: { opacity: 0 },
}
function POSBackground(props: { className?: string }) {
  return (
    <motion.div
      className={twMerge('absolute inset-0 -z-[1]', props.className)}
      variants={backgroundVariants}
      initial='initial'
      animate='animate'
      exit='exit'
      transition={{ duration: 0.3, ease: 'easeOut' }}
    ></motion.div>
  )
}

const buttonVariants = {
  initial: { scale: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 1.5, opacity: 0 },
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
        type='button'
        variants={buttonVariants}
        initial='initial'
        animate='animate'
        exit='exit'
        onClick={props.onClick}
        transition={{ duration: 0.3, type: 'tween' }}
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
            'group-data-loading:overflow-hidden',
          )}
        >
          <div className='hidden h-full w-full group-data-loading:skeleton group-data-loading:block'></div>
        </div>
        {/* Label */}
        {props.isLoading ? (
          <Spinner className='h-7 w-7' />
        ) : (
          <p
            className={twMerge(
              'indent-[0.05em] text-lg font-bold tracking-wider',
              props.step === 5 && 'text-white',
              'group-data-loading:hidden',
            )}
          >
            {props.label}
          </p>
        )}
      </motion.button>
    </div>
  )
}
