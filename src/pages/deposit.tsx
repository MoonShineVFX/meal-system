import {
  CurrencyDollarIcon,
  PlusCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'

import Button from '@/components/core/Button'
import { useDialog } from '@/components/core/Dialog'
import Error from '@/components/core/Error'
import Spinner from '@/components/core/Spinner'
import Title from '@/components/core/Title'
import DepositExplanation from '@/components/deposit/DepositExplanation'
import NumberInput from '@/components/form/base/NumberInput'
import { useStore } from '@/lib/client/store'
import trpc from '@/lib/client/trpc'
import { settings } from '@/lib/common'

const DEPOSIT_PRESET_AMOUNTS = [100, 300, 500, 1000]

export default function DepositPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const { data, isError, error, isLoading } = trpc.user.get.useQuery()
  const metaQuery = trpc.deposit.getMeta.useQuery()
  const [depositAmount, setDepositAmount] = useState(0)
  const depositCreateMutation = trpc.deposit.create.useMutation()
  const depositDeleteMutation = trpc.deposit.delete.useMutation()
  const { dialog, showDialog } = useDialog()
  const { routeHistory, setDepositRedirect } = useStore((state) => ({
    routeHistory: state.history,
    setDepositRedirect: state.setDepositRedirect,
  }))

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
    if (value > settings.DEPOSIT_MAX_AMOUNT) {
      setDepositAmount(settings.DEPOSIT_MAX_AMOUNT)
      return
    }
    setDepositAmount(value)
  }, [])

  const handleClick = useCallback(() => {
    if (depositCreateMutation.error) depositCreateMutation.reset()

    depositCreateMutation.mutate(
      {
        amount: depositAmount,
      },
      {
        onSuccess: (data) => {
          // save redirect metadata
          const url = routeHistory[routeHistory.length - 2]
          if (url) {
            setDepositRedirect({
              id: data.depositId,
              url: url,
            })
          }

          showDialog({
            title: '儲值金額確認',
            icon: 'info',
            confirmText: '付款',
            content: (
              <>
                <p>
                  儲值
                  <span className='mx-1 font-bold text-yellow-500'>
                    {depositAmount}
                  </span>
                  元，轉換成
                  <span className='mx-1 font-bold text-yellow-500'>
                    {metaQuery.data?.ratio
                      ? depositAmount * metaQuery.data.ratio
                      : '?'}
                  </span>
                  夢想幣，將導向付款頁面
                </p>
                <input
                  className='sr-only'
                  name='MerchantID'
                  value={data.merchantId}
                  readOnly
                ></input>
                <input
                  className='sr-only'
                  name='Version'
                  value={data.version}
                  readOnly
                ></input>
                <input
                  className='sr-only'
                  name='TradeInfo'
                  value={data.tradeInfo}
                  readOnly
                ></input>
                <input
                  className='sr-only'
                  name='TradeSha'
                  value={data.tradeSha}
                  readOnly
                ></input>
              </>
            ),
            as: 'form',
            cancel: true,
            onCancel: () => {
              setDepositRedirect(null)
              depositDeleteMutation.mutate({ id: data.depositId })
              depositCreateMutation.reset()
            },
            panelProps: {
              method: 'post',
              action: data.action,
            },
          })
        },
      },
    )
  }, [depositAmount, depositCreateMutation, router.query])

  if (isError) return <Error description={error.message} />

  return (
    <div className='relative h-full w-full'>
      <div className='ms-scroll absolute inset-0 p-4 lg:p-8'>
        <div className='mx-auto flex h-full max-w-md flex-col gap-4'>
          <Title prefix='儲值' />
          <h1 className='text-xl font-bold tracking-wider'>儲值</h1>
          {/* Currency info */}
          <section className='mx-auto flex w-fit flex-col items-center gap-2'>
            <h2 className='text-sm font-bold'>夢想幣</h2>
            <div className='flex items-center gap-2'>
              <CurrencyDollarIcon className='h-8 w-8 text-yellow-500' />
              <p className='relative text-3xl font-bold'>
                {isLoading ? (
                  <Spinner className='h-9 w-9 p-1' />
                ) : (
                  data!.creditBalance
                )}
                {metaQuery.data?.ratio && depositAmount !== 0 && (
                  <div className='absolute inset-y-0 left-full flex items-center'>
                    <span className='ml-1 whitespace-nowrap text-base text-yellow-500'>
                      +{depositAmount * metaQuery.data.ratio}
                    </span>
                  </div>
                )}
              </p>
            </div>
          </section>
          {/* Input */}
          <section className='flex flex-col gap-2 rounded-2xl border p-4 shadow'>
            <p className='text-xs text-stone-400'>
              最多可儲值 {settings.DEPOSIT_MAX_AMOUNT} 元
            </p>
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
                  max={settings.DEPOSIT_MAX_AMOUNT}
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
                      Math.min(
                        prevAmount + amount,
                        settings.DEPOSIT_MAX_AMOUNT,
                      ),
                    )
                  }
                >
                  +{amount}
                </button>
              ))}
            </div>
            {/* Explanation */}
          </section>
          <section className='px-4'>
            <h3 className='text-sm font-bold text-stone-500'>注意事項與說明</h3>
            <DepositExplanation />
          </section>
          <div className='sticky bottom-0 mt-auto bg-white'>
            <Button
              isDisabled={
                depositAmount < settings.DEPOSIT_MIN_AMOUNT ||
                depositAmount > settings.DEPOSIT_MAX_AMOUNT ||
                isLoading
              }
              isLoading={
                depositCreateMutation.isPending ||
                depositCreateMutation.isSuccess
              }
              className='h-12 w-full shrink-0 group-data-loading:skeleton'
              textClassName='font-bold text-lg'
              label='下一步'
              onClick={handleClick}
            />
          </div>
          {dialog}
        </div>
      </div>
    </div>
  )
}
