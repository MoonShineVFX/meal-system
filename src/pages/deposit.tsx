import { useState, useCallback, useEffect, useRef } from 'react'
import {
  CurrencyDollarIcon,
  PlusCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/router'

import trpc from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import Button from '@/components/core/Button'
import Image from '@/components/core/Image'
import { settings } from '@/lib/common'
import Spinner from '@/components/core/Spinner'
import NumberInput from '@/components/form/base/NumberInput'

const DEPOSIT_AMOUNT_MIN = 1
const DEPOSIT_AMOUNT_MAX = 9999
const DEPOSIT_PRESET_AMOUNTS = [100, 300, 500, 1000]

export default function DepositPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { data, isError, error, isLoading } = trpc.user.get.useQuery()
  const [depositAmount, setDepositAmount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const twmpMutation = trpc.twmp.createDeposit.useMutation()
  const router = useRouter()

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [inputRef])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') return setDepositAmount(0)
    while (e.target.value.length > 1 && e.target.value[0] === '0') {
      e.target.value = e.target.value.slice(1)
    }

    const value = parseInt(e.target.value)
    if (isNaN(value)) return
    if (value > DEPOSIT_AMOUNT_MAX || value < DEPOSIT_AMOUNT_MIN) return
    setDepositAmount(value)
  }, [])

  const handleClick = useCallback(() => {
    twmpMutation.mutate(
      {
        amount: depositAmount,
        isMobile,
      },
      {
        onSuccess: (data) => {
          if (isMobile) {
            window.location.href = data.callbackUrl!
          } else {
            router.push(`/twmp/${data.orderNo}`)
          }
        },
      },
    )
  }, [depositAmount, isMobile, twmpMutation])

  if (isError) return <Error description={error.message} />

  return (
    <div className='mx-auto flex h-full max-w-md flex-col gap-4 p-4 lg:p-8'>
      <h1 className='text-xl font-bold tracking-wider'>儲值</h1>
      {/* Currency info */}
      <section className='mx-auto flex w-fit flex-col items-center gap-2'>
        <h2 className='text-sm font-bold'>夢想幣</h2>
        <div className='flex items-center gap-2'>
          <CurrencyDollarIcon className='h-8 w-8 text-yellow-500' />
          <p className='text-3xl font-bold'>
            {isLoading ? (
              <Spinner className='h-9 w-9 p-1' />
            ) : (
              data!.creditBalance
            )}
          </p>
        </div>
      </section>
      {/* Input */}
      <section className='flex flex-col gap-2 rounded-2xl border p-4 shadow'>
        <p className='text-xs text-stone-400'>最多可儲值 9999</p>
        {/* Field */}
        <div className='flex items-center gap-4 '>
          <div className='flex items-center gap-2'>
            <PlusCircleIcon className='h-8 w-8 shrink-0 text-yellow-500' />
            <p className='whitespace-nowrap'>儲值金額</p>
          </div>
          <div className='relative w-full flex-1'>
            <NumberInput
              ref={inputRef}
              pattern='\d*'
              hideSpinner={true}
              className='h-12 w-full rounded-lg pr-10 text-right text-3xl font-bold text-yellow-500'
              value={depositAmount}
              min={DEPOSIT_AMOUNT_MIN}
              max={DEPOSIT_AMOUNT_MAX}
              onChange={handleInput}
            />
            {depositAmount > 0 && (
              <div
                className='group/clear absolute inset-y-0 right-1 flex cursor-pointer items-center active:scale-90'
                onClick={() => setDepositAmount(0)}
              >
                <XMarkIcon className=' h-7 w-7 rounded-full text-stone-300 group-hover/clear:bg-stone-200 group-active/clear:bg-stone-200' />
              </div>
            )}
          </div>
        </div>
        {/* Preset */}
        <div className='mt-4 flex flex-wrap gap-4'>
          {DEPOSIT_PRESET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              className='rounded-2xl bg-stone-100 p-2 text-lg font-bold text-stone-500 hover:bg-stone-200 active:scale-90 active:bg-stone-200'
              onClick={() =>
                setDepositAmount((prevAmount) =>
                  Math.min(prevAmount + amount, DEPOSIT_AMOUNT_MAX),
                )
              }
            >
              +{amount}
            </button>
          ))}
        </div>
      </section>
      <div className='mt-auto flex items-center justify-center gap-2 text-sm'>
        將移轉自
        <div className='relative inline-block h-8 w-8'>
          <Image
            src={settings.RESOURCE_TWPAY_LOGO}
            alt='台灣pay圖案'
            sizes='64px'
          />
        </div>
        <span className='font-bold'>台灣Pay</span>進行儲值
        {isMobile ? 'mo' : 'de'}
      </div>
      <Button
        isDisabled={
          depositAmount < DEPOSIT_AMOUNT_MIN ||
          depositAmount > DEPOSIT_AMOUNT_MAX ||
          isLoading
        }
        isLoading={twmpMutation.isLoading || twmpMutation.isSuccess}
        className='h-12 w-full group-data-loading:skeleton'
        textClassName='font-bold text-lg'
        label='儲值'
        onClick={handleClick}
      />
    </div>
  )
}
