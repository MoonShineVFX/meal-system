import { twMerge } from 'tailwind-merge'
import { useState } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

import Button from '@/components/core/Button'
import trpc from '@/lib/client/trpc'
import { twData } from '@/lib/common'
import Error from '@/components/core/Error'
import { useRouter } from 'next/router'
import PriceNumber from '@/components/core/PriceNumber'
import { useEffect } from 'react'
import { useDialog } from '@/components/core/Dialog'
import DepositExplanation from '@/components/deposit/DepositExplanation'

export default function Checkout(props: {
  className?: string
  totalPrice: number
  isLoading: boolean
  retailCipher?: string
  onDeposit?: () => void
  autoCheckout?: boolean
}) {
  const [isAutoCheckoutInitial, setIsAutoCheckoutInitial] = useState<
    boolean | undefined
  >(undefined)
  const {
    data: userData,
    isLoading: userIsLoading,
    isError: userIsError,
    error: userError,
  } = trpc.user.get.useQuery(undefined)
  const { showDialog, dialog } = useDialog()
  const router = useRouter()
  const createOrderFromCartMutation = trpc.order.addFromCart.useMutation()
  const createOrderFromRetailMutation = trpc.order.addFromRetail.useMutation()
  const currentMutation = props.retailCipher
    ? createOrderFromRetailMutation
    : createOrderFromCartMutation

  const handleCheckout = () => {
    if (props.retailCipher) {
      createOrderFromRetailMutation.mutate(
        { cipher: props.retailCipher },
        {
          onSuccess: () => {
            router.push('/order/archived')
          },
        },
      )
    } else {
      createOrderFromCartMutation.mutate(undefined, {
        onSuccess: (orders) => {
          if (orders.length === 0) return
          const referenceOrder = orders[0]
          if (referenceOrder.menu.type === 'LIVE') {
            router.push('/order/live')
          } else {
            router.push('/order/reservation')
          }
        },
      })
    }
  }

  const pointBalance = userData?.pointBalance ?? 0
  const creditBalance = userData?.creditBalance ?? 0

  const pointBalnceToPay = Math.min(pointBalance, props.totalPrice)
  const creditBalanceToPay = props.totalPrice - pointBalnceToPay
  const isNotEnough = creditBalanceToPay > creditBalance

  useEffect(() => {
    if (isAutoCheckoutInitial === undefined) {
      setIsAutoCheckoutInitial(props.autoCheckout ?? false)
    }
  }, [props.autoCheckout])

  useEffect(() => {
    if (
      isAutoCheckoutInitial &&
      userData &&
      !isNotEnough &&
      currentMutation.isIdle &&
      props.totalPrice !== 0
    ) {
      handleCheckout()
    }
  }, [userData, isNotEnough, isAutoCheckoutInitial])

  if (userIsError) return <Error description={userError.message} />

  return (
    <div
      className={twMerge(
        'group sticky top-0 flex h-min flex-col gap-4 rounded-2xl bg-stone-100 p-6 @container/checkout',
        props.className,
      )}
      {...twData({ loading: props.isLoading || userIsLoading })}
    >
      {!props.retailCipher && (
        <header className='flex justify-between'>
          <h2 className='rounded-xl text-lg font-bold tracking-widest group-data-loading:skeleton'>
            結帳
          </h2>
          <PriceNumber className='text-lg' price={props.totalPrice} />
        </header>
      )}
      <section className='flex flex-col text-stone-500'>
        {/* Point balance */}
        {
          <div className='flex justify-between border-b border-stone-200 py-2 sm:py-4'>
            <div className='flex items-center gap-1'>
              <p className='rounded-xl tracking-widest group-data-loading:skeleton'>
                點數
              </p>
              <PriceNumber price={pointBalance - pointBalnceToPay} isCurrency />
            </div>
            <PriceNumber price={pointBalnceToPay} isPayment />
          </div>
        }
        {/* Credit balance */}
        <div className='flex justify-between border-stone-200 py-2 sm:py-4'>
          <div className='flex items-center gap-1'>
            <p className='rounded-xl tracking-widest group-data-loading:skeleton'>
              夢想幣
            </p>
            <PriceNumber
              price={creditBalance - creditBalanceToPay}
              isNotEnough={isNotEnough}
              isCurrency
            />
          </div>
          <PriceNumber price={creditBalanceToPay} isPayment />
        </div>
      </section>
      <button
        className='mx-auto w-fit rounded-2xl px-2 py-1 text-sm text-stone-400 hover:bg-stone-200 active:scale-95 active:bg-stone-200'
        onClick={() =>
          showDialog({
            title: '點數 與 夢想幣 說明與注意事項',
            content: <DepositExplanation />,
            icon: 'info',
          })
        }
      >
        <ExclamationCircleIcon className='mr-1 inline-block h-4 w-4' />
        點數 與 夢想幣 說明與注意事項
      </button>
      {/* Checkout button */}
      <div className='grid grid-rows-2 gap-4 @xs/checkout:grid-cols-2 @xs/checkout:grid-rows-none'>
        <Button
          isLoading={currentMutation.isLoading || currentMutation.isSuccess}
          isBusy={currentMutation.isLoading || currentMutation.isSuccess}
          isDisabled={isNotEnough || props.totalPrice === 0}
          label={isNotEnough ? '餘額不足' : '確認付款'}
          className=' h-12 grow text-lg font-bold group-data-loading:skeleton @xs/checkout:order-1'
          onClick={handleCheckout}
        />
        <Button
          label='儲值'
          className='h-12 w-full grow text-lg font-bold group-data-loading:skeleton'
          theme='secondary'
          onClick={() => {
            props.onDeposit?.()
            router.push('/deposit')
          }}
        />
      </div>
      {dialog}
    </div>
  )
}
