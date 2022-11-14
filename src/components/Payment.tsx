import { useRouter } from 'next/router'
import VirtualNumpad from './VirtualNumpad'
import { useEffect, useState } from 'react'
import { CircleStackIcon } from '@heroicons/react/24/solid'
import { Transition } from '@headlessui/react'
import { Role } from '@prisma/client'
import { useAtom } from 'jotai'

import { addNotificationAtom, NotificationType } from './Notification'
import trpc from '@/trpc/client/client'
import SwitchButton from './SwitchButton'
import Spinner from './Spinner'

export default function Payment(props: { isOpen: boolean }) {
  const router = useRouter()
  const [isUsingPoint, setUsingPoint] = useState(false)
  const { data: userData } = trpc.user.info.useQuery(undefined)
  const [totalPaymentAmount, setTotalPaymentAmount] = useState(0)
  const [step, setStep] = useState(0)
  const chargeMutation = trpc.trade.charge.useMutation()
  const trpcContext = trpc.useContext()
  const [, addNotification] = useAtom(addNotificationAtom)

  useEffect(() => {
    // Set default value
    if (props.isOpen) {
      setTotalPaymentAmount(0)
      setStep(0)
      if (userData && userData?.points > 0) {
        setUsingPoint(true)
      }
    }
  }, [props.isOpen])

  const handleClose = () => {
    router.push('/')
  }

  const handleBackFromStep2 = () => {
    if (!chargeMutation.isLoading) setStep(0)
  }

  const handleCharge = async () => {
    chargeMutation.mutate(
      {
        amount: totalPaymentAmount,
        isUsingPoint,
      },
      {
        onSuccess: async () => {
          addNotification({
            type: NotificationType.SUCCESS,
            message: '付款成功',
          })
          trpcContext.user.info.invalidate(undefined)
          trpcContext.trade.listTransactions.invalidate({ role: Role.USER })
          handleClose()
        },
        onError: async () => {
          addNotification({
            type: NotificationType.ERROR,
            message: '付款失敗',
          })
        },
      },
    )
  }

  const pointsPaymentAmount = isUsingPoint
    ? Math.min(totalPaymentAmount, userData?.points ?? 0)
    : 0
  const creditsPaymentAmount = totalPaymentAmount - pointsPaymentAmount
  const isNotEnough = creditsPaymentAmount > (userData?.credits ?? 0)

  return (
    <>
      {/* step 0 */}
      <Transition
        show={props.isOpen && step === 0}
        enter='transition-opacity duration-150'
        enterFrom='opacity-0'
        enterTo='opacity-100'
        leave='transition-opacity duration-150'
        leaveFrom='opacity-100'
        leaveTo='opacity-0'
        onClick={handleClose}
        className='fixed inset-0 z-50 select-none bg-stone-800/50 backdrop-blur-[2px]'
      >
        <div className='mx-auto flex h-full w-full max-w-lg flex-col'>
          {/* Upper area */}
          <Transition.Child
            enter='transition-all duration-150'
            enterFrom='scale-75'
            enterTo='scale-100'
            leave='transition-all duration-150'
            leaveFrom='scale-100'
            leaveTo='scale-75'
            className='flex grow flex-col justify-center bg-stone-100 tall:mx-4 tall:bg-transparent'
          >
            {/* Panel */}
            <PaymentPanel
              totalPaymentAmount={totalPaymentAmount}
              isNotEnough={isNotEnough}
              isUsingPoint={isUsingPoint}
              pointsPaymentAmount={pointsPaymentAmount}
              creditsPaymentAmount={creditsPaymentAmount}
              pointsCurrentAmount={userData?.points ?? 0}
              creditsCurrentAmount={userData?.credits ?? 0}
            />
          </Transition.Child>
          {/* Keyboard */}
          <Transition.Child
            enter='transition-all duration-150'
            enterFrom='translate-y-full'
            enterTo='translate-y-0'
            leave='transition-all duration-150'
            leaveFrom='translate-y-0'
            leaveTo='translate-y-full'
            className='border-t-[1px] border-stone-300 tall:border-t-0'
            onClick={(event: any) => {
              event.preventDefault()
              event.stopPropagation()
            }}
          >
            <div
              data-ui={userData?.points ? 'active' : 'not-active'}
              className='group/points flex items-center justify-between bg-stone-100 p-4 tall:rounded-t-xl'
            >
              <p
                data-ui={isUsingPoint ? 'active' : 'not-active'}
                className='group/usep flex items-center gap-2 tracking-wider text-stone-600 group-data-not-active/points:opacity-40'
              >
                <CircleStackIcon className='absolute h-4 w-4 animate-ping text-amber-400 group-data-not-active/points:hidden group-data-not-active/usep:hidden' />
                <CircleStackIcon className='h-4 w-4 text-amber-500 group-data-not-active/usep:text-stone-400' />
                使用福利點數折抵
              </p>
              <SwitchButton
                className='group-data-not-active/points:pointer-events-none group-data-not-active/points:opacity-40'
                checked={isUsingPoint}
                onChange={setUsingPoint}
              />
            </div>
            <VirtualNumpad
              setValue={setTotalPaymentAmount}
              onAccept={() => setStep(1)}
              onCancel={handleClose}
              maxValue={9999}
              disabledAccept={isNotEnough || totalPaymentAmount === 0}
            />
          </Transition.Child>
        </div>
      </Transition>
      {/* step 1 */}
      <Transition
        show={props.isOpen && step === 1}
        enter='transition-opacity duration-150'
        enterFrom='opacity-0'
        enterTo='opacity-100'
        leave='transition-opacity duration-150'
        leaveFrom='opacity-100'
        leaveTo='opacity-0'
        className='fixed inset-0 z-50 flex select-none flex-col justify-center bg-stone-800/50 backdrop-blur-[2px]'
        onClick={(event: any) => {
          handleBackFromStep2()
          event.preventDefault()
          event.stopPropagation()
        }}
      >
        {/* Confirm */}
        <Transition.Child
          enter='transition-all duration-150'
          enterFrom='scale-75 -translate-y-[25vh]'
          enterTo='scale-100 translate-y-0'
          leave='transition-all duration-150'
          leaveFrom='scale-100 translate-y-0'
          leaveTo='scale-75 -translate-y-[25vh]'
        >
          <PaymentPanel
            totalPaymentAmount={totalPaymentAmount}
            isNotEnough={isNotEnough}
            isUsingPoint={isUsingPoint}
            pointsPaymentAmount={pointsPaymentAmount}
            creditsPaymentAmount={creditsPaymentAmount}
            pointsCurrentAmount={userData?.points ?? 0}
            creditsCurrentAmount={userData?.credits ?? 0}
            isConfirm={true}
            onAccept={handleCharge}
            onCancel={handleBackFromStep2}
            isLoading={chargeMutation.isLoading}
          />
        </Transition.Child>
      </Transition>
    </>
  )
}

function PaymentPanel(props: {
  totalPaymentAmount: number
  isNotEnough: boolean
  isUsingPoint: boolean
  pointsPaymentAmount: number
  creditsPaymentAmount: number
  pointsCurrentAmount: number
  creditsCurrentAmount: number
  isConfirm?: boolean
  isLoading?: boolean
  onCancel?: () => void
  onAccept?: () => void
}) {
  return (
    <div
      className='group/panel mx-auto flex w-full max-w-xs grow translate-y-0 translate-x-0 flex-col justify-between rounded-xl bg-stone-100 p-4 tall:grow-0 tall:p-6'
      data-ui={props.isConfirm ? 'not-active' : 'active'}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      {/* Payment total */}
      <div>
        <div className='mb-1 text-center text-2xl tracking-widest'>
          {props.isConfirm ? '請確認付款金額' : '付款金額'}
        </div>
        <div className='flex justify-center text-4xl'>
          <div
            data-ui={props.isNotEnough ? 'not-active' : 'active'}
            className={'relative data-not-active:text-red-600'}
          >
            {props.totalPaymentAmount}
            <div className='absolute right-0 top-0 h-full w-1 translate-x-full group-data-not-active/panel:hidden'>
              <div className='ml-[1px] h-full w-[3px] animate-blink bg-stone-800'></div>
            </div>
          </div>
        </div>
      </div>
      {/* Divider */}
      <div className='mx-auto my-4 w-4/5 border-t-[1px] border-stone-300'></div>
      {/* Payment detail */}
      <div className='flex flex-col gap-2'>
        <PaymentDetail
          active={props.isUsingPoint}
          paymentAmount={props.pointsPaymentAmount}
          label='福利點數'
          currentAmount={props.pointsCurrentAmount}
        />
        <PaymentDetail
          active={true}
          paymentAmount={props.creditsPaymentAmount}
          label='夢想幣'
          currentAmount={props.creditsCurrentAmount}
        />
      </div>
      {/* Confirm Buttons */}
      <div className='group/buttons mt-6 hidden group-data-not-active/panel:flex'>
        <button
          onClick={props.onCancel}
          disabled={props.isLoading}
          className='grow basis-0 rounded-xl bg-stone-200 py-3 indent-[0.1em] text-xl tracking-widest text-stone-500 disabled:cursor-not-allowed disabled:opacity-40 data-active:hover:bg-stone-300 data-active:active:bg-stone-300'
        >
          返回
        </button>
        <button
          onClick={props.onAccept}
          disabled={props.isLoading}
          className='ml-4 grow basis-0 rounded-xl bg-stone-800 py-3 indent-[0.1em] text-xl tracking-widest text-stone-100 disabled:cursor-not-allowed disabled:opacity-75 data-active:hover:bg-amber-900 data-active:active:bg-amber-900'
        >
          {props.isLoading ? (
            <div className='flex items-center justify-center'>
              <Spinner className='h-6 w-6' />
            </div>
          ) : (
            '確認付款'
          )}
        </button>
      </div>
    </div>
  )
}

function PaymentDetail(props: {
  active: boolean
  paymentAmount: number
  label: string
  currentAmount: number
}) {
  const isNotEnough = props.paymentAmount > props.currentAmount

  return (
    <div
      className='group flex text-stone-600 data-not-active:opacity-50'
      data-ui={props.active ? 'active' : 'not-active'}
    >
      <div className='flex items-center gap-1'>
        {props.label}
        <div className='text-sm text-stone-400'>{`(${props.currentAmount})`}</div>
      </div>
      <div
        data-ui={
          props.paymentAmount > 0 && !isNotEnough ? 'active' : 'not-active'
        }
        className='grow text-right font-bold data-active:text-amber-600 data-active:before:content-["-"] group-data-not-active:hidden'
      >
        {isNotEnough ? (
          <span className='rounded-md bg-red-600 px-2 py-1 font-normal text-white'>
            餘額不足
          </span>
        ) : (
          props.paymentAmount
        )}
      </div>
    </div>
  )
}