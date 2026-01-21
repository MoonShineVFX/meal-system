import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { UserAuthority } from '@prisma/client'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'

import Button from '@/components/core/Button'
import { useDialog } from '@/components/core/Dialog'
import { DropdownMenu, DropdownMenuItem } from '@/components/core/DropdownMenu'
import Error from '@/components/core/Error'
import PriceNumber from '@/components/core/PriceNumber'
import DepositExplanation from '@/components/deposit/DepositExplanation'
import Toggle from '@/components/form/base/Toggle'
import trpc from '@/lib/client/trpc'
import { twData, validateAuthority } from '@/lib/common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import TextInput from '../form/base/TextInput'
import {
  useCreateOrderFromCartMutation,
  useCreateOrderFromRetailMutation,
} from '@/lib/client/trpc.hooks'

export default function Checkout(props: {
  className?: string
  totalPrice: number
  isLoading: boolean
  retailCipher?: string
  retailQuantity?: number
  onDeposit?: () => void
  autoCheckout?: boolean
  isDisabled?: boolean
}) {
  const [isClientOrder, setIsClientOrder] = useState<boolean>(false)
  const [isAutoCheckoutInitial, setIsAutoCheckoutInitial] = useState<
    boolean | undefined
  >(undefined)

  const trpcContext = trpc.useContext()
  const {
    data: userData,
    isLoading: userIsLoading,
    isError: userIsError,
    error: userError,
  } = trpc.user.get.useQuery(undefined)

  const { showDialog, dialog } = useDialog()
  const router = useRouter()
  const createOrderFromCartMutation = useCreateOrderFromCartMutation()
  const createOrderFromRetailMutation = useCreateOrderFromRetailMutation()
  const currentMutation = props.retailCipher
    ? createOrderFromRetailMutation
    : createOrderFromCartMutation
  const [clientOrderNote, setClientOrderNote] = useState<string>('')

  const handleCheckout = () => {
    if (props.retailCipher) {
      createOrderFromRetailMutation.mutate(
        {
          cipher: props.retailCipher,
          quantity: props.retailQuantity,
        },
        {
          onSuccess: () => {
            router.push('/order/archived')
          },
        },
      )
      return
    }
    createOrderFromCartMutation.mutate(
      { clientOrder: isClientOrder, note: clientOrderNote },
      {
        onSuccess: (orders) => {
          if (orders.length === 0) return
          const referenceOrder = orders[0]
          if (referenceOrder.menu.type === 'LIVE') {
            router.push('/order/live')
          } else {
            router.push('/order/reservation')
          }
        },
        onError: () => {
          // Invalidate cart and menu when error
          // Because the cart might be modified due to invalidation
          trpcContext.menu.get.invalidate()
          trpcContext.cart.get.invalidate()
        },
      },
    )
  }

  const pointBalance = userData?.pointBalance ?? 0
  const creditBalance = userData?.creditBalance ?? 0

  const pointBalnceToPay = Math.max(Math.min(pointBalance, props.totalPrice), 0)
  const creditBalanceToPay = props.totalPrice - pointBalnceToPay
  const isNotEnough = creditBalanceToPay > creditBalance && !isClientOrder

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

  const canClientOrder =
    !props.retailCipher &&
    userData! &&
    validateAuthority(userData, UserAuthority.CLIENT_ORDER)

  return (
    <div
      className={twMerge(
        'group sticky top-0 flex h-min flex-col gap-4 rounded-2xl bg-stone-100 p-6 @container/checkout',
        props.className,
      )}
      {...twData({ loading: props.isLoading || userIsLoading })}
    >
      {/* Client order */}
      {isClientOrder && canClientOrder && (
        <>
          <label className='mb-4 flex w-full cursor-pointer items-center justify-between'>
            <h2 className='rounded-xl text-lg font-bold tracking-widest group-data-loading:skeleton'>
              客戶招待
            </h2>
            <div className='mr-1 flex items-center'>
              <Toggle
                checked={isClientOrder}
                onChange={(event) => setIsClientOrder(event.target.checked)}
              />
            </div>
          </label>
          <TextInput
            placeholder='請輸入詳細備註'
            value={clientOrderNote}
            onChange={(e) => {
              setClientOrderNote(e.target.value)
            }}
            className='mb-4'
          />
        </>
      )}
      {/* Header */}
      {!props.retailCipher && !isClientOrder && (
        <header className='flex justify-between'>
          <h2 className='rounded-xl text-lg font-bold tracking-widest group-data-loading:skeleton'>
            結帳
          </h2>
          {!canClientOrder ? (
            <PriceNumber className='text-lg' price={props.totalPrice} />
          ) : (
            <DropdownMenu
              label={
                <PriceNumber className='text-lg' price={props.totalPrice} />
              }
              className='py-0 px-0'
            >
              <DropdownMenuItem
                label='客戶招待'
                onClick={() => {
                  setIsClientOrder(true)
                }}
              />
            </DropdownMenu>
          )}
        </header>
      )}
      {!isClientOrder && (
        <section className='flex flex-col text-stone-500'>
          {/* Point balance */}
          {
            <div className='flex justify-between border-b border-stone-200 py-2 sm:py-4'>
              <div className='flex items-center gap-1'>
                <p className='rounded-xl tracking-widest group-data-loading:skeleton'>
                  點數
                </p>
                <PriceNumber
                  price={pointBalance - pointBalnceToPay}
                  isCurrency
                />
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
      )}
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
          isLoading={currentMutation.isPending || currentMutation.isSuccess}
          isBusy={currentMutation.isPending || currentMutation.isSuccess}
          isDisabled={
            (isNotEnough && !isClientOrder) ||
            (isClientOrder && clientOrderNote.length < 4) ||
            props.isDisabled
          }
          label={
            isNotEnough ? '餘額不足' : isClientOrder ? '確認下單' : '確認付款'
          }
          className=' h-12 grow text-lg font-bold group-data-loading:skeleton @xs/checkout:order-1'
          onClick={handleCheckout}
        />
        <Button
          label='儲值'
          className='h-12 w-full grow text-lg font-bold disabled:opacity-50 group-data-loading:skeleton'
          theme='secondary'
          onClick={() => {
            props.onDeposit?.()
            router.push('/deposit')
          }}
          isDisabled={isClientOrder}
        />
      </div>
      {dialog}
    </div>
  )
}
