import Image from '@/components/core/Image'

import trpc from '@/lib/client/trpc'
import { OrderOptions, settings } from '@/lib/common'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function Cart() {
  const { data, isLoading, isError, error } = trpc.menu.getCart.useQuery()

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div className='text-red-400'>{error?.message}</div>

  return (
    <div className='relative h-full w-full'>
      <div className='absolute inset-0 flex flex-col gap-8 overflow-auto p-8'>
        <h1 className='text-xl font-bold'>購物車</h1>
        <ul className='flex flex-col'>
          {data.cartItems.map((cartItem) => (
            <li
              key={`${cartItem.menuId}${cartItem.commodityId}${cartItem.optionsKey}`}
              className='flex w-full cursor-pointer gap-4 border-b border-stone-200 py-4 first:border-y hover:bg-stone-100 active:bg-stone-100'
            >
              {/* Image */}
              <section className='relative aspect-square h-min w-full max-w-[6rem] overflow-hidden rounded-md'>
                <Image
                  style={{ WebkitTouchCallout: 'none' }}
                  className='object-cover'
                  src={
                    cartItem.commodityOnMenu.commodity.image?.path ??
                    settings.RESOURCE_FOOD_PLACEHOLDER
                  }
                  sizes='(max-width: 375px) 100vw, (max-width: 750px) 75vw, 640px'
                  alt={
                    cartItem.commodityOnMenu.commodity.name ??
                    'food placeholder'
                  }
                />
              </section>
              {/* Content */}
              <section className='relative flex flex-1 flex-col gap-2'>
                {/* Name */}
                <h2 className='font-bold'>
                  {cartItem.commodityOnMenu.commodity.name}
                </h2>
                {/* Options */}
                {Object.keys(cartItem.options as OrderOptions).length > 0 && (
                  <div className='flex'>
                    {Object.values(cartItem.options as OrderOptions)
                      .flatMap((optionValue) =>
                        Array.isArray(optionValue)
                          ? optionValue
                          : [optionValue],
                      )
                      .map((optionValue) => (
                        <span className='border-l border-stone-200 px-2 text-sm text-stone-400 first:border-none first:pl-0'>
                          {optionValue}
                        </span>
                      ))}
                  </div>
                )}
                {/* Price */}
                <h3>${cartItem.commodityOnMenu.commodity.price}</h3>
              </section>
              <section className='flex flex-col justify-center'>
                <div className='flex items-center gap-2'>
                  <p className='text-sm text-stone-400'>數量:</p>
                  <p className='font-bold text-stone-500'>
                    {cartItem.quantity}
                  </p>
                </div>
              </section>
              {/* Close button */}
              <section>
                <button className='rounded-full p-1 hover:bg-stone-100 active:bg-stone-100'>
                  <XMarkIcon className='h-5 w-5 stroke-1 text-white md:text-stone-500' />
                </button>
              </section>
            </li>
          ))}
        </ul>
        <summary className='flex flex-col rounded-md bg-stone-100 p-8'>
          <h2 className='mb-4 text-xl font-bold'>結帳</h2>
          <div className='flex justify-between'>
            <p>總計</p>
            <p>
              $
              {data.cartItems.reduce(
                (acc: number, cartItem) =>
                  (acc +=
                    cartItem.commodityOnMenu.commodity.price *
                    cartItem.quantity),
                0,
              )}
            </p>
          </div>
        </summary>
      </div>
    </div>
  )
}
