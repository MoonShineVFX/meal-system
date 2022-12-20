import { twMerge } from 'tailwind-merge'
import { useState, useRef, useEffect } from 'react'
import { animate } from 'framer-motion'

import Button from '@/components/core/Button'
import trpc from '@/lib/client/trpc'
import { twData } from '@/lib/common'

export function Checkout(props: {
  className?: string
  totalPrice: number
  isLoading: boolean
}) {
  const {
    data: userData,
    isLoading: userIsLoading,
    isError: userIsError,
    error: userError,
  } = trpc.user.get.useQuery(undefined)
  const createOrderMutation = trpc.order.add.useMutation()

  const handleCheckout = () => {
    createOrderMutation.mutate()
  }

  if (userIsError)
    return (
      <div className='flex rounded-2xl bg-stone-100 p-6 text-red-400'>
        {userError?.message ?? '錯誤'}
      </div>
    )

  const pointBalance = userData?.pointBalance ?? 0
  const creditBalance = userData?.creditBalance ?? 0

  const pointBalnceToPay = Math.min(pointBalance, props.totalPrice)
  const creditBalanceToPay = props.totalPrice - pointBalnceToPay
  const isNotEnough = creditBalanceToPay > creditBalance

  return (
    <div
      {...twData({ loading: props.isLoading || userIsLoading })}
      className={twMerge(
        'group sticky top-0 flex h-min flex-col gap-4 rounded-2xl bg-stone-100 p-6 @container/checkout',
        props.className,
      )}
    >
      <header className='flex justify-between'>
        <h2 className='rounded-xl text-lg font-bold tracking-widest group-data-loading:skeleton'>
          結帳
        </h2>
        <Price className='text-lg' price={props.totalPrice} />
      </header>
      <section className='flex flex-col text-stone-500'>
        {/* Point balance */}
        {
          <div className='flex justify-between border-b border-stone-200 py-2'>
            <div className='flex items-center gap-1'>
              <p className='rounded-xl text-sm tracking-wider group-data-loading:skeleton'>
                點數
              </p>
              <Price price={pointBalance - pointBalnceToPay} isCurrency />
            </div>
            <Price price={pointBalnceToPay} isPayment />
          </div>
        }
        {/* Credit balance */}
        <div className='flex justify-between border-stone-200 py-2'>
          <div className='flex items-center gap-1'>
            <p className='rounded-xl text-sm tracking-wider group-data-loading:skeleton'>
              夢想幣
            </p>
            <Price
              price={creditBalance - creditBalanceToPay}
              isNotEnough={isNotEnough}
              isCurrency
            />
          </div>
          <Price price={creditBalanceToPay} isPayment />
        </div>
      </section>
      {/* Checkout button */}
      <div className='grid grid-rows-2 gap-4 @xs/checkout:grid-cols-2 @xs/checkout:grid-rows-none'>
        <Button
          isLoading={
            createOrderMutation.isLoading || createOrderMutation.isSuccess
          }
          isBusy={
            createOrderMutation.isLoading || createOrderMutation.isSuccess
          }
          isDisabled={isNotEnough || props.totalPrice === 0}
          label={isNotEnough ? '餘額不足' : '確認付款'}
          className=' h-12 grow text-lg font-bold group-data-loading:skeleton @xs/checkout:order-1'
          onClick={handleCheckout}
        />
        <Button
          label='儲值'
          className='h-12 grow text-lg font-bold group-data-loading:skeleton'
          theme='secondary'
        />
      </div>
    </div>
  )
}

function Price(props: {
  price: number
  className?: string
  isPayment?: boolean
  isNotEnough?: boolean
  isCurrency?: boolean
}) {
  const priceRef = useRef<HTMLSpanElement>(null)
  const [isInitialMount, setIsInitialMount] = useState(true)

  useEffect(() => {
    if (!priceRef.current) return
    const currentPrice = Number(priceRef.current.textContent)
    const controls = animate(currentPrice, props.price, {
      duration: isInitialMount ? 0 : 0.3,
      onUpdate: (value) => {
        if (!priceRef.current) return
        priceRef.current.textContent = value.toFixed(0)
      },
    })
    if (isInitialMount) setIsInitialMount(false)
    return () => controls.stop()
  }, [props.price, priceRef.current])

  const prefix = props.isPayment ? (props.price > 0 ? '-' : '') : ''

  return (
    <p
      className={twMerge(
        'rounded-xl font-bold group-data-loading:skeleton group-data-loading:min-w-[2em]',
        props.className,
        props.isCurrency && 'text-yellow-500',
        props.isNotEnough && 'text-red-400',
      )}
    >
      {prefix}
      {!props.isCurrency && !props.isPayment && '$'}
      <span ref={priceRef}>0</span>
    </p>
  )
}
