import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import trpc from '@/lib/client/trpc'
import Error from '@/components/core/Error'
import { SpinnerBlock } from '@/components/core/Spinner'
import Image from '@/components/core/Image'
import { settings } from '@/lib/common'
import Checkout from '@/components/cart/Checkout'
import Title from '@/components/core/Title'
import { useStore } from '@/lib/client/store'
import CheckBox from '@/components/form/base/CheckBox'

export default function PageQRCode() {
  const router = useRouter()
  const userQuery = trpc.user.get.useQuery()
  const [cipher, setCipher] = useState<string | null>(null)
  const addToHistory = useStore((state) => state.addToHistory)
  const [autoCheckout, setAutoCheckout] = useState<boolean | undefined>(
    undefined,
  )
  const { data, error, isLoading } = trpc.menu.getCOMFromQRCodeCipher.useQuery(
    {
      cipher: cipher as string,
    },
    { enabled: cipher !== null },
  )

  useEffect(() => {
    const isAutoCheckout = localStorage.getItem('autoCheckout') === 'true'
    setAutoCheckout(isAutoCheckout)
  }, [])

  useEffect(() => {
    if (!router.isReady || !userQuery.isSuccess) return
    if (router.query.key !== undefined) {
      setCipher(router.query.key as string)
      router.replace('/qrcode', undefined, { shallow: true })
    } else if (userQuery.data && cipher === null) {
      router.replace('/live')
    }
  }, [router.query.key, userQuery.isSuccess])

  if (error) return <Error description={error.message} />
  if (isLoading) return <SpinnerBlock text='讀取 QRCode' />
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
              ${data.commodity.price}
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
                    {value}
                  </span>
                ))}
            </div>
          </div>
        </div>
        {typeof autoCheckout === 'boolean' && (
          <div className='absolute inset-x-0 bottom-0 p-4'>
            <label className='mb-4 flex w-fit cursor-pointer items-center gap-2'>
              <CheckBox
                checked={autoCheckout}
                onChange={() => {
                  const isAutoCheckout = !autoCheckout
                  setAutoCheckout(isAutoCheckout)
                  localStorage.setItem(
                    'autoCheckout',
                    isAutoCheckout.toString(),
                  )
                }}
              />
              <div className='flex flex-col gap-0.5'>
                <h3 className='text-sm font-bold'>啟用快速付款</h3>
                <p className='text-xs text-stone-400'>
                  之後 QRCode 付款直接結帳，不需確認
                </p>
              </div>
            </label>
            <Checkout
              isLoading={false}
              totalPrice={data.commodity.price}
              retailCipher={cipher}
              onDeposit={() => addToHistory(`/qrcode?key=${cipher}`)}
              autoCheckout={autoCheckout}
            />
          </div>
        )}
      </div>
    </div>
  )
}
