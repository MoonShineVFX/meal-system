import { Listbox, Transition } from '@headlessui/react'
import { twMerge } from 'tailwind-merge'
import React, {
  useState,
  useEffect,
  Fragment,
  memo,
  useRef,
  useMemo,
} from 'react'
import * as ReactDOM from 'react-dom'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { motion, useAnimationControls } from 'framer-motion'
import colors from 'tailwindcss/colors'
import { TrashIcon } from '@heroicons/react/24/outline'
import { PencilIcon } from '@heroicons/react/24/outline'

import type { CartItems, InvalidCartItems } from '@/lib/client/trpc'
import Image from '@/components/core/Image'
import {
  settings,
  twData,
  getOrderOptionsPrice,
  getOptionName,
  getOptionPrice,
} from '@/lib/common'
import trpc from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'
import { ScrollFader } from '@/components/cart/ScrollFader'
import SwipeToDelete from './SwipeToDelete'
import Button from '@/components/core/Button'
import OptionPrice from '../core/OptionPrice'

const COLOR_HIGHLIGHT = colors.yellow[500] + (25).toString(16)
const COLOR_TRANSPARENT = 'rgba(255, 255, 255, 0)'
const COLOR_DELETE = colors.red[400] + (25).toString(16)

function CartItemCard(props: {
  cartItem: CartItems[0] | InvalidCartItems[0]
  isDisabled?: boolean
  onOptionsClick?: (cartItem: CartItems[0]) => void
  isLoading?: boolean
  isInvalid?: boolean
}) {
  const { cartItem } = props
  const deleteCartMutation = trpc.cart.delete.useMutation()
  const updateCartMutation = trpc.cart.update.useMutation()
  const [selectedQauntity, setSelectedQuantity] = useState(cartItem.quantity)
  const motionControls = useAnimationControls()
  const [isInitialRender, setIsInitialRender] = useState(false)
  const [portalElement, setPortalElement] = useState<HTMLElement>()
  const [referenceElement, setReferenceElement] = useState<HTMLElement>()
  const coreRef = useRef<HTMLDivElement>(null)

  // Variables
  const cartItemId = `cart-item-${cartItem.menuId}-${cartItem.commodityId}-${cartItem.optionsKey}`
  const isChangingQuantity = selectedQauntity !== cartItem.quantity
  const isLoading = isChangingQuantity || updateCartMutation.isLoading

  // Change quantity
  useEffect(() => {
    setSelectedQuantity(cartItem.quantity)
  }, [cartItem.quantity])

  const isSkeleton = !!props.isLoading

  // Track portal element until valid
  useEffect(() => {
    const portalInterval = setInterval(() => {
      if (!portalElement) {
        const element = document.getElementById(cartItemId) as HTMLElement
        if (element) {
          setPortalElement(element)
          clearInterval(portalInterval)
        }
      }
    }, 100)
    const referenceInterval = setInterval(() => {
      if (!referenceElement) {
        const element = document.getElementById(
          `reference-${cartItemId}`,
        ) as HTMLElement
        if (element) {
          setReferenceElement(element)
          clearInterval(referenceInterval)
        }
      }
    }, 100)

    return () => clearInterval(portalInterval)
  }, [])

  // Animate background color when updated
  useEffect(() => {
    if (cartItem.invalid) return
    if (!isInitialRender && cartItem) {
      setIsInitialRender(true)
      return
    }
    if (cartItem) {
      motionControls.start({
        backgroundColor: [COLOR_HIGHLIGHT, COLOR_TRANSPARENT],
      })
    }
  }, [cartItem.optionsKey, cartItem.quantity])

  const updateCartItem = (quantity: number) => {
    updateCartMutation.mutate(
      {
        commodityId: cartItem.commodityId,
        menuId: cartItem.menuId,
        quantity: quantity ?? selectedQauntity,
        options: cartItem.options,
        optionsKey: cartItem.optionsKey,
      },
      {
        onError: async () => {
          setSelectedQuantity(cartItem.quantity)
        },
      },
    )
  }

  const handleQuantityChange = (quantity: number) => {
    if (isLoading) return

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

  const price = useMemo(() => {
    const basePrice = cartItem.commodityOnMenu.commodity.price

    if (cartItem.optionsKey === '__skeleton') return basePrice

    return getOrderOptionsPrice(
      cartItem.options,
      cartItem.commodityOnMenu.commodity.optionSets,
      basePrice,
    )
  }, [cartItem])

  const quantities = cartItem.invalid
    ? [cartItem.quantity - 1]
    : [
        ...Array(
          Math.min(
            (cartItem as CartItems[0]).commodityOnMenu.maxQuantity,
            (cartItem as CartItems[0]).commodityOnMenu.menu.maxQuantity,
          ) + cartItem.quantity,
        ).keys(),
      ]

  return (
    <SwipeToDelete
      portalId={cartItemId}
      onDelete={() => handleQuantityChange(0)}
      coreRef={coreRef}
      referenceElement={referenceElement}
      isDisabled={isLoading || props.isDisabled}
      isInvalid={cartItem.invalid}
    >
      <motion.div
        className='w-full'
        animate={motionControls}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={
            cartItem.invalid || cartItem.optionsKey === '__skeleton'
              ? undefined
              : {
                  backgroundColor: COLOR_HIGHLIGHT,
                  scale: 0.5,
                }
          }
          animate={{ backgroundColor: COLOR_TRANSPARENT, scale: 1.0 }}
          exit={{
            opacity: 0,
            scale: 0.5,
            backgroundColor: COLOR_DELETE,
            transition: {
              opacity: { duration: 0.2 },
              backgroundColor: { duration: 0 },
            },
          }}
          transition={{
            default: {
              duration: 0.3,
              type: 'spring',
            },
            backgroundColor: { duration: 1.0 },
          }}
        >
          <div
            ref={coreRef}
            className='group/card dividy-y flex w-full gap-4 border-b border-stone-200 py-4 last:border-none data-not-available:pointer-events-none data-not-available:opacity-75 @2xl/cart:gap-6 @2xl/cart:py-6 hover:bg-stone-50'
            {...twData({
              available: !cartItem.invalid && !isLoading && !props.isDisabled,
              loading: isSkeleton,
            })}
          >
            {/* Image */}
            <section className='my-auto h-min w-full max-w-[4rem] shrink-0 @2xl/cart:max-w-[6rem]'>
              <div className='relative aspect-square overflow-hidden rounded-full bg-stone-400 group-data-loading:skeleton'>
                <Image
                  style={{ WebkitTouchCallout: 'none' }}
                  className='object-cover group-data-loading:hidden'
                  src={
                    cartItem.commodityOnMenu.commodity.image?.path ??
                    settings.RESOURCE_FOOD_PLACEHOLDER
                  }
                  sizes='256px'
                  alt={
                    cartItem.commodityOnMenu.commodity.name ??
                    'food placeholder'
                  }
                />
              </div>
            </section>
            <div className='grid grow grid-cols-2'>
              {/* Content */}
              <section className='flex flex-col gap-2 @2xl/cart:pt-1'>
                {/* Name */}
                <h2 className='w-fit rounded-xl font-bold tracking-wider group-data-loading:skeleton'>
                  {cartItem.commodityOnMenu.commodity.name}
                </h2>
                {/* Options */}
                {Object.keys(cartItem.options).length > 0 && (
                  <div
                    className='group/options -m-1 flex w-fit cursor-pointer items-center gap-2 rounded-md p-1 active:scale-95'
                    onClick={handleOptionsClick}
                    title='更改選項'
                  >
                    <div className='flex flex-col gap-0.5 @2xl/cart:gap-1'>
                      {Object.entries(cartItem.options)
                        .map(([optionName, optionValue]) => ({
                          optionName,
                          optionValue,
                          order:
                            cartItem.commodityOnMenu.commodity.optionSets?.find(
                              (option) => option.name === optionName,
                            )?.order ?? Infinity,
                        }))
                        .flatMap((option) =>
                          Array.isArray(option.optionValue)
                            ? option.optionValue
                            : [option.optionValue],
                        )
                        .map((optionValue) => {
                          const price = getOptionPrice(optionValue)
                          return (
                            <span
                              key={getOptionName(optionValue)}
                              className='w-fit whitespace-nowrap rounded-xl text-xs text-stone-400 group-hover/options:underline group-data-loading:skeleton @2xl/cart:text-sm'
                            >
                              {getOptionName(optionValue)}
                              <OptionPrice
                                className='pl-1 text-stone-400'
                                price={price}
                                dollarSign
                              />
                            </span>
                          )
                        })}
                    </div>
                    {!props.isInvalid && (
                      <PencilIcon className='h-3 w-3 stroke-1 text-stone-400 transition-transform group-hover/options:rotate-45 group-data-loading:hidden' />
                    )}
                  </div>
                )}
              </section>
              {/* Quantity and Price*/}
              <section className='flex justify-between'>
                <div className='flex h-fit items-center gap-1'>
                  <Listbox
                    value={selectedQauntity}
                    onChange={handleQuantityChange}
                    disabled={cartItem.invalid || isChangingQuantity}
                    as='div'
                  >
                    <Listbox.Button
                      id={`reference-${cartItemId}`}
                      className='relative flex w-[5.5ch] items-center justify-start rounded-2xl border border-stone-200 py-1 group-data-loading:skeleton hover:bg-stone-200 disabled:hover:bg-transparent active:scale-95 active:bg-stone-200'
                    >
                      <p className='ml-3'>
                        {selectedQauntity === 0 ? (
                          <span className='text-red-400'>0</span>
                        ) : (
                          selectedQauntity
                        )}
                      </p>
                      {props.isInvalid ? null : isChangingQuantity ? (
                        <Spinner className='absolute right-1 h-4 w-4' />
                      ) : (
                        <ChevronDownIcon className='absolute right-1 h-4 w-4 text-stone-400 transition-transform ui-open:rotate-180' />
                      )}
                    </Listbox.Button>
                    {portalElement &&
                      ReactDOM.createPortal(
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
                            <Listbox.Options className='absolute right-0 top-2 z-[0] w-[125%] overflow-hidden rounded-2xl border border-stone-200 bg-white px-1 py-2 shadow-md focus:outline-none'>
                              <ScrollFader>
                                <div className='flex h-full max-h-[30vh] flex-col gap-2 overflow-y-auto scrollbar-none'>
                                  {[-1, ...quantities].map((quantity) => (
                                    <Listbox.Option
                                      value={quantity + 1}
                                      key={quantity}
                                      className={twMerge(
                                        'cursor-pointer rounded-xl px-1 py-1 text-center data-selected:bg-stone-100 hover:bg-stone-100 active:bg-stone-100',
                                        quantity === -1 &&
                                          'text-sm text-red-400',
                                      )}
                                      {...twData({
                                        selected:
                                          quantity + 1 === cartItem.quantity,
                                      })}
                                    >
                                      {quantity + 1}
                                    </Listbox.Option>
                                  ))}
                                </div>
                              </ScrollFader>
                            </Listbox.Options>
                          </div>
                        </Transition>,
                        portalElement,
                      )}
                  </Listbox>
                  {!props.isInvalid && (
                    <Button
                      isDisabled={isLoading}
                      className='hidden h-6 w-6 group-data-loading:skeleton hover:bg-stone-200 active:bg-stone-200 sm:flex'
                      textClassName='group-data-loading:skeleton'
                      spinnerClassName='h-4 w-4'
                      label={<TrashIcon className='h-4 w-4 text-stone-400' />}
                      title='刪除餐點'
                      theme='support'
                      onClick={() => handleQuantityChange(0)}
                    />
                  )}
                </div>
                {/* Price */}
                <div className='flex flex-col @2xl/cart:pt-1'>
                  <h3 className='h-fit whitespace-nowrap rounded-xl text-end font-bold group-data-loading:skeleton'>
                    ${price}
                  </h3>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </SwipeToDelete>
  )
}

export default memo(CartItemCard)
