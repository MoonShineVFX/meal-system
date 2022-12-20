import { twMerge } from 'tailwind-merge'
import { useState, useRef, useEffect } from 'react'
import { animate } from 'framer-motion'

import Button from '@/components/core/Button'
import trpc from '@/lib/client/trpc'

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

  if (userIsLoading || props.isLoading)
    return (
      <div className='sticky top-0 flex h-min flex-col gap-4 rounded-2xl bg-stone-100 p-6'>
        <header className='flex h-8 justify-between'>
          <h2 className='skeleton w-12 rounded-md'></h2>
          <div className='skeleton w-12 rounded-md'></div>
        </header>
        <section className='flex flex-col gap-4 text-stone-500'>
          <div className='skeleton h-6 rounded-md'></div>
          <div className='skeleton h-6 rounded-md'></div>
        </section>
        {/* Checkout button */}
        <div className='grid grid-rows-2 gap-4 @xs/checkout:grid-cols-2 @xs/checkout:grid-rows-none'>
          <Button
            label=''
            isDisabled={true}
            className='skeleton h-12 grow text-lg @xs/checkout:order-1'
          />
          <Button
            label=''
            isDisabled={true}
            className='skeleton h-12 grow bg-stone-200 text-lg'
            theme='secondary'
          />
        </div>
      </div>
    )
  if (userIsError)
    return (
      <div className='flex rounded-2xl bg-stone-100 p-6 text-red-400'>
        {userError?.message ?? '錯誤'}
      </div>
    )

  const pointBalnceToPay = Math.min(userData.pointBalance, props.totalPrice)
  const creditBalanceToPay = props.totalPrice - pointBalnceToPay
  const isNotEnough = creditBalanceToPay > userData.creditBalance

  return (
    <div
      className={twMerge(
        'sticky top-0 flex h-min flex-col gap-4 rounded-2xl bg-stone-100 p-6 @container/checkout',
        props.className,
      )}
    >
      <header className='flex justify-between'>
        <h2 className='text-lg font-bold tracking-widest'>結帳</h2>
        <Price className='text-lg' price={props.totalPrice} />
      </header>
      <section className='flex flex-col text-stone-500'>
        {/* Point balance */}
        {
          <div className='flex justify-between border-b border-stone-200 py-2'>
            <div className='flex items-center gap-1'>
              <p className='text-sm tracking-wider'>點數</p>
              <Price
                price={userData.pointBalance - pointBalnceToPay}
                isCurrency
              />
            </div>
            <Price price={pointBalnceToPay} isPayment />
          </div>
        }
        {/* Credit balance */}
        <div className='flex justify-between border-stone-200 py-2'>
          <div className='flex items-center gap-1'>
            <p className='text-sm tracking-wider'>夢想幣</p>
            <Price
              price={userData.creditBalance - creditBalanceToPay}
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
          className=' h-12 grow text-lg font-bold @xs/checkout:order-1'
          onClick={handleCheckout}
        />
        <Button
          label='儲值'
          className='h-12 grow text-lg font-bold'
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
    <div className='relative'>
      <p
        className={twMerge(
          'font-bold',
          props.className,
          props.isCurrency && 'text-yellow-500',
          props.isNotEnough && 'text-red-400',
        )}
      >
        {prefix}
        {!props.isCurrency && !props.isPayment && '$'}
        <span ref={priceRef}>0</span>
      </p>
    </div>
  )
}
