import { Listbox, Transition } from '@headlessui/react'
import { twMerge } from 'tailwind-merge'
import { useState, useEffect, Fragment, memo } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

import type { CartItems, InvalidCartItems } from '@/lib/client/trpc'
import Image from '@/components/core/Image'
import { OrderOptions, settings, twData, OptionSet } from '@/lib/common'
import trpc from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'

function CartItemCard(props: {
  cartItem: CartItems[0] | InvalidCartItems[0]
  disabled?: boolean
  onOptionsClick?: (cartItem: CartItems[0]) => void
  enableUpdateEffect?: boolean
}) {
  const { cartItem } = props
  const deleteCartMutation = trpc.cart.delete.useMutation()
  const updateCartMutation = trpc.cart.update.useMutation()
  const [selectedQauntity, setSelectedQuantity] = useState(cartItem.quantity)
  const [isUpdated, setIsUpdated] = useState(false)

  useEffect(() => {
    setSelectedQuantity(cartItem.quantity)
  }, [cartItem.quantity])

  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (cartItem) {
      setIsUpdated(true)
      timeout = setTimeout(() => {
        setIsUpdated(false)
      }, 100)
    }
    return () => {
      clearTimeout(timeout)
    }
  }, [cartItem.optionsKey, cartItem.quantity])

  const updateCartItem = (quantity: number) => {
    updateCartMutation.mutate({
      commodityId: cartItem.commodityId,
      menuId: cartItem.menuId,
      quantity: quantity ?? selectedQauntity,
      options: cartItem.options as OrderOptions,
      optionsKey: cartItem.optionsKey,
    })
  }

  const handleQuantityChange = (quantity: number) => {
    setSelectedQuantity(quantity)
    if (quantity === 0) {
      // Delete cart item
      deleteCartMutation.mutate(
        {
          ids: [
            {
              commodityId: cartItem.commodityId,
              menuId: cartItem.menuId,
              optionsKey: cartItem.optionsKey,
            },
          ],
        },
        {
          onError: async () => {
            setSelectedQuantity(cartItem.quantity)
          },
        },
      )
    } else {
      // Update cart item
      updateCartItem(quantity)
    }
  }

  const handleOptionsClick = () => {
    if (props.onOptionsClick) {
      props.onOptionsClick(cartItem as CartItems[0])
    }
  }

  const quantities = cartItem.invalid
    ? [cartItem.quantity - 1]
    : [
        ...Array(
          (cartItem as CartItems[0]).commodityOnMenu.maxQuantity +
            cartItem.quantity,
        ).keys(),
      ]

  const isChangingQuantity = selectedQauntity !== cartItem.quantity
  const isLoading = isChangingQuantity || updateCartMutation.isLoading

  return (
    <div
      data-ui={twData({
        available: !cartItem.invalid && !isLoading && !props.disabled,
      })}
      className={twMerge(
        'group/card dividy-y flex w-full gap-4 border-b border-stone-200 py-4 transition-colors duration-2000 last:border-none data-not-available:pointer-events-none data-not-available:opacity-75 @2xl/cart:gap-6 @2xl/cart:py-6',
        isUpdated && props.enableUpdateEffect && 'bg-green-100 duration-0',
      )}
    >
      {/* Image */}
      <section className='h-min w-full max-w-[5rem] shrink-0 p-1 @2xl/cart:max-w-[7rem] @2xl/cart:p-2'>
        <div className='relative aspect-square overflow-hidden rounded-full'>
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
        </div>
      </section>
      <div className='grid grow grid-cols-2'>
        {/* Content */}
        <section className='relative flex flex-col gap-2 rounded-md'>
          {/* Name */}
          <h2 className='font-bold tracking-wider'>
            {cartItem.commodityOnMenu.commodity.name}
          </h2>
          {/* Options */}
          {Object.keys(cartItem.options as OrderOptions).length > 0 && (
            <div
              onClick={handleOptionsClick}
              className='-m-1 flex w-fit cursor-pointer flex-col gap-0.5 rounded-md p-1 @2xl/cart:gap-1 hover:bg-stone-100 active:bg-stone-100'
            >
              {Object.entries(cartItem.options as OrderOptions)
                .map(([optionName, optionValue]) => ({
                  optionName,
                  optionValue,
                  order:
                    (
                      cartItem.commodityOnMenu.commodity
                        .optionSets as OptionSet[]
                    )?.find((option) => option.name === optionName)?.order ??
                    Infinity,
                }))
                .sort((a, b) => a.order - b.order)
                .flatMap((option) =>
                  Array.isArray(option.optionValue)
                    ? option.optionValue
                    : [option.optionValue],
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
            value={selectedQauntity}
            onChange={handleQuantityChange}
            disabled={cartItem.invalid || isChangingQuantity}
            as='div'
          >
            <Listbox.Button className='relative flex w-[5.5ch] items-center justify-start rounded-2xl border border-stone-200 py-1 hover:bg-stone-100 disabled:hover:bg-transparent'>
              <p className='ml-3'>
                {selectedQauntity === 0 ? (
                  <span className='text-red-400'>0</span>
                ) : (
                  selectedQauntity
                )}
              </p>
              {isChangingQuantity ? (
                <Spinner className='absolute right-1 h-4 w-4' />
              ) : (
                <ChevronDownIcon className='absolute right-1 h-4 w-4 text-stone-400 transition-transform ui-open:rotate-180' />
              )}
            </Listbox.Button>
            <Transition
              enter='transition duration-100 ease-out'
              enterFrom='transform scale-y-0 opacity-0'
              enterTo='transform scale-y-100 opacity-100'
              leave='transition duration-75 ease-out'
              leaveFrom='transform scale-y-100 opacity-100'
              leaveTo='transform scale-y-0 opacity-0'
              as={Fragment}
            >
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
            </Transition>
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

export default memo(CartItemCard)
