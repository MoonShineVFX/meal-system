import { twMerge } from 'tailwind-merge'

import Button from '@/components/core/Button'
import trpc from '@/lib/client/trpc'
import { twData } from '@/lib/common'
import Error from '@/components/core/Error'
import { useRouter } from 'next/router'
import PriceNumber from '@/components/core/PriceNumber'

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
  const router = useRouter()
  const createOrderMutation = trpc.order.add.useMutation()

  const handleCheckout = () => {
    createOrderMutation.mutate(undefined, {
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

  if (userIsError) return <Error description={userError.message} />

  const pointBalance = userData?.pointBalance ?? 0
  const creditBalance = userData?.creditBalance ?? 0

  const pointBalnceToPay = Math.min(pointBalance, props.totalPrice)
  const creditBalanceToPay = props.totalPrice - pointBalnceToPay
  const isNotEnough = creditBalanceToPay > creditBalance

  return (
    <div
      className={twMerge(
        'group sticky top-0 flex h-min flex-col gap-4 rounded-2xl bg-stone-100 p-6 @container/checkout',
        props.className,
      )}
      {...twData({ loading: props.isLoading || userIsLoading })}
    >
      <header className='flex justify-between'>
        <h2 className='rounded-xl text-lg font-bold tracking-widest group-data-loading:skeleton'>
          結帳
        </h2>
        <PriceNumber className='text-lg' price={props.totalPrice} />
      </header>
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
