import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'

import Checkout from '@/components/cart/Checkout'
import Error from '@/components/core/Error'
import Image from '@/components/core/Image'
import { SpinnerBlock } from '@/components/core/Spinner'
import Title from '@/components/core/Title'
import Toggle from '@/components/form/base/Toggle'
import { useStore } from '@/lib/client/store'
import trpc from '@/lib/client/trpc'
import { getOptionName, getOrderOptionsPrice, settings } from '@/lib/common'

export default function PageQRCode() {
  const router = useRouter()
  const userQuery = trpc.user.get.useQuery()
  const [cipher, setCipher] = useState<string | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const { addToHistory, qrcodeAutoCheckout, setQRCodeAutoCheckout } = useStore(
    (state) => ({
      addToHistory: state.addToHistory,
      qrcodeAutoCheckout: state.qrcodeAutoCheckout_local,
      setQRCodeAutoCheckout: state.setQRCodeAutoCheckout,
    }),
  )
  const { data, error, isLoading } = trpc.menu.getCOMFromQRCodeCipher.useQuery(
    {
      cipher: cipher as string,
      quantity: 1, // just for query max quantity
    },
    { enabled: cipher !== null },
  )

  useEffect(() => {
    if (!router.isReady || !userQuery.isSuccess) return
    if (router.query.key !== undefined) {
      setCipher(router.query.key as string)
      setQuantity(1) // Reset quantity when cipher changes
      router.replace('/qrcode', undefined, { shallow: true })
    } else if (userQuery.data && cipher === null) {
      router.replace('/live')
    }
  }, [router.query.key, userQuery.isSuccess])

  const handleQuantityChange = useCallback(
    (action: 'INCREASE' | 'DECREASE') => {
      const maxQuantity =
        data?.maxQuantity ?? settings.MENU_MAX_QUANTITY_PER_ORDER
      switch (action) {
        case 'INCREASE':
          if (quantity < maxQuantity) {
            setQuantity(quantity + 1)
          }
          break
        case 'DECREASE':
          if (quantity > 1) {
            setQuantity(quantity - 1)
          }
          break
      }
    },
    [quantity, data?.maxQuantity],
  )

  if (error) return <Error description={error.message} />
  if (isLoading && !data) return <SpinnerBlock text='讀取 QRCode' />
  if (!data || cipher === null) return <Error description='無效的 QRCode' />

  return (
    <div className='relative mx-auto h-full w-full max-w-lg'>
      <Title prefix='QRCode 付款' />
      <div className='absolute inset-0 p-4 lg:p-8'>
        <h1 className='mb-4 text-xl font-bold tracking-wider lg:mb-8'>
          QRCode 付款
        </h1>
        <div className='flex gap-6'>
          <div className='w-24'>
            <div className='relative aspect-square w-full overflow-hidden rounded-2xl'>
              <Image
                className='object-cover'
                src={
                  data.commodity.image?.path ??
                  settings.RESOURCE_FOOD_PLACEHOLDER
                }
                sizes='120px'
                alt={data.commodity.name ?? '餐點圖片'}
              />
            </div>
          </div>
          <div className='flex flex-1 flex-col gap-1'>
            <p className='text-xl font-bold tracking-widest'>
              {data.commodity.name}
            </p>
            <p className='text-lg font-bold text-yellow-500'>
              $
              {getOrderOptionsPrice(
                data.options,
                data.commodity.optionSets,
                data.commodity.price,
              )}
            </p>
            <div className='flex flex-col gap-0.5'>
              {Object.entries(data.options)
                .flatMap(([, optionValue]) =>
                  Array.isArray(optionValue) ? optionValue : [optionValue],
                )
                .map((value, index) => (
                  <span
                    key={index}
                    className='whitespace-nowrap text-xs text-stone-400'
                  >
                    {getOptionName(value)}
                  </span>
                ))}
            </div>
          </div>
        </div>
        {userQuery.data && (
          <div className='absolute inset-x-0 bottom-0 p-4'>
            {/* Quantity selector */}
            <div className='mb-4 flex items-center justify-between'>
              <p className='text-sm font-bold tracking-widest'>數量</p>
              <div className='flex items-center gap-2 rounded-full bg-stone-100 p-1'>
                <button
                  type='button'
                  onClick={() => handleQuantityChange('DECREASE')}
                  disabled={quantity <= 1}
                  className='rounded-full p-1 text-stone-500 disabled:pointer-events-none disabled:text-stone-300 hover:bg-stone-200 active:bg-stone-200'
                >
                  <MinusIcon className='h-5 w-5' />
                </button>
                <p className='min-w-[1.2em] text-center text-xl text-stone-500'>
                  {quantity}
                </p>
                <button
                  type='button'
                  onClick={() => handleQuantityChange('INCREASE')}
                  disabled={
                    quantity >=
                    (data?.maxQuantity ?? settings.MENU_MAX_QUANTITY_PER_ORDER)
                  }
                  className='rounded-full p-1 text-stone-500 disabled:pointer-events-none disabled:text-stone-300 hover:bg-stone-200 active:bg-stone-200'
                >
                  <PlusIcon className='h-5 w-5' />
                </button>
              </div>
            </div>
            <label className='mb-4 flex w-full cursor-pointer items-center justify-between'>
              <div className='flex flex-col gap-0.5'>
                <h3 className='text-sm font-bold'>啟用快速付款</h3>
                <p className='text-xs text-stone-400'>
                  之後 QRCode 付款直接結帳，不需確認
                </p>
              </div>
              <div className='mr-1 flex items-center'>
                <Toggle
                  checked={qrcodeAutoCheckout}
                  onChange={(event) =>
                    setQRCodeAutoCheckout(event.target.checked)
                  }
                />
              </div>
            </label>
            <Checkout
              isLoading={false}
              totalPrice={
                getOrderOptionsPrice(
                  data.options,
                  data.commodity.optionSets,
                  data.commodity.price,
                ) * quantity
              }
              retailCipher={cipher}
              retailQuantity={quantity}
              onDeposit={() => addToHistory(`/qrcode?key=${cipher}`)}
              autoCheckout={qrcodeAutoCheckout}
            />
          </div>
        )}
      </div>
    </div>
  )
}
