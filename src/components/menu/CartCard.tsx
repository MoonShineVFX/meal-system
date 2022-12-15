import { Listbox } from '@headlessui/react'
import { twMerge } from 'tailwind-merge'

import type { CartItems, InvalidCartItems } from '@/lib/client/trpc'
import Image from '@/components/core/Image'
import { OrderOptions, settings, twData } from '@/lib/common'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

export default function CartCard(props: {
  cartItem: CartItems[0] | InvalidCartItems[0]
  disabled?: boolean
}) {
  const { cartItem } = props

  const handleQuantityChange = (quantity: number) => {
    console.log(quantity)
  }

  const quantities = cartItem.invalid
    ? [cartItem.quantity - 1]
    : [
        ...Array(
          (cartItem as CartItems[0]).commodityOnMenu.maxQuantity +
            cartItem.quantity,
        ).keys(),
      ]

  return (
    <div
      data-ui={twData({ available: !cartItem.invalid })}
      className='group/card dividy-y flex w-full gap-4 border-b border-stone-200 py-4 last:border-none data-not-available:pointer-events-none data-not-available:opacity-75 @2xl/cart:gap-6 @2xl/cart:py-8'
    >
      {/* Image */}
      <section className='relative aspect-square h-min w-full max-w-[5rem] shrink-0 cursor-pointer overflow-hidden rounded-md @2xl/cart:max-w-[8rem] hover:opacity-75 active:opacity-75'>
        <Image
          style={{ WebkitTouchCallout: 'none' }}
          className='object-cover'
          src={
            cartItem.commodityOnMenu.commodity.image?.path ??
            settings.RESOURCE_FOOD_PLACEHOLDER
          }
          sizes='(max-width: 375px) 100vw, (max-width: 750px) 75vw, 640px'
          alt={cartItem.commodityOnMenu.commodity.name ?? 'food placeholder'}
        />
      </section>
      <div className='grid grow grid-cols-2'>
        {/* Content */}
        <section className='relative flex cursor-pointer flex-col gap-2 rounded-md hover:bg-stone-100 active:bg-stone-100'>
          {/* Name */}
          <h2 className='font-bold tracking-wider'>
            {cartItem.commodityOnMenu.commodity.name}
          </h2>
          {/* Options */}
          {Object.keys(cartItem.options as OrderOptions).length > 0 && (
            <div className='flex flex-col gap-0.5 @2xl/cart:gap-1'>
              {Object.values(cartItem.options as OrderOptions)
                .flatMap((optionValue) =>
                  Array.isArray(optionValue) ? optionValue : [optionValue],
                )
                .map((optionValue) => (
                  <span
                    key={optionValue}
                    className='whitespace-nowrap text-xs text-stone-400 @2xl/cart:text-sm'
                  >
                    {optionValue}
                  </span>
                ))}
            </div>
          )}
        </section>
        {/* Quantity and Price*/}
        <section className='flex justify-between'>
          <Listbox
            value={cartItem.quantity}
            onChange={handleQuantityChange}
            disabled={cartItem.invalid}
            as='div'
          >
            <Listbox.Button className='relative flex w-[5.5ch] items-center justify-start rounded-2xl border border-stone-200 py-1 hover:bg-stone-100'>
              <p className='ml-3'>{cartItem.quantity}</p>
              <ChevronDownIcon className='absolute right-1 h-4 w-4 text-stone-400 transition-transform ui-open:rotate-180' />
            </Listbox.Button>
            <div className='relative z-10'>
              <Listbox.Options className='absolute right-0 top-2 flex max-h-[30vh] w-[125%] flex-col gap-2 overflow-y-auto rounded-2xl border border-stone-200 bg-white px-1 py-2 shadow-md scrollbar-none focus:outline-none'>
                {[-1, ...quantities].map((quantity) => (
                  <Listbox.Option
                    value={quantity + 1}
                    key={quantity}
                    data-ui={twData({
                      selected: quantity + 1 === cartItem.quantity,
                    })}
                    className={twMerge(
                      'cursor-pointer rounded-xl px-1 py-1 text-center data-selected:bg-stone-100 hover:bg-stone-100 active:bg-stone-100',
                      quantity === -1 && 'text-sm text-red-400',
                    )}
                  >
                    {quantity === -1 ? '刪除' : quantity + 1}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
          {/* Price */}
          <h3 className='whitespace-nowrap text-end font-bold'>
            ${cartItem.commodityOnMenu.commodity.price}
          </h3>
        </section>
      </div>
    </div>
  )
}
