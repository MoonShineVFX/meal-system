import { Listbox, Transition } from '@headlessui/react'
import { twMerge } from 'tailwind-merge'
import React, { useState, useEffect, Fragment, memo, useRef } from 'react'
import * as ReactDOM from 'react-dom'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { motion, useAnimationControls } from 'framer-motion'
import colors from 'tailwindcss/colors'

import type { CartItems, InvalidCartItems } from '@/lib/client/trpc'
import Image from '@/components/core/Image'
import { OrderOptions, settings, twData, OptionSet } from '@/lib/common'
import trpc from '@/lib/client/trpc'
import Spinner from '@/components/core/Spinner'
import { ScrollFader } from '@/components/core/ScrollFader'

const COLOR_HIGHLIGHT = colors.yellow[500] + (25).toString(16)
const COLOR_TRANSPARENT = 'rgba(255, 255, 255, 0)'
const COLOR_DELETE = colors.red[400] + (25).toString(16)

function CartItemCard(props: {
  cartItem: CartItems[0] | InvalidCartItems[0]
  disabled?: boolean
  onOptionsClick?: (cartItem: CartItems[0]) => void
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
    updateCartMutation.mutate({
      commodityId: cartItem.commodityId,
      menuId: cartItem.menuId,
      quantity: quantity ?? selectedQauntity,
      options: cartItem.options as OrderOptions,
      optionsKey: cartItem.optionsKey,
    })
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

  const quantities = cartItem.invalid
    ? [cartItem.quantity - 1]
    : [
        ...Array(
          (cartItem as CartItems[0]).commodityOnMenu.maxQuantity +
            cartItem.quantity,
        ).keys(),
      ]

  return (
    <SwipeToDelete
      portalId={cartItemId}
      onDelete={() => handleQuantityChange(0)}
      coreRef={coreRef}
      referenceElement={referenceElement}
      disabled={isLoading}
    >
      <motion.div
        className='w-full'
        animate={motionControls}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{
            backgroundColor: COLOR_HIGHLIGHT,
          }}
          animate={{ backgroundColor: COLOR_TRANSPARENT }}
          exit={{
            opacity: 0,
            backgroundColor: COLOR_DELETE,
            transition: {
              default: { duration: 0.3 },
              backgroundColor: { duration: 0.0 },
            },
          }}
          transition={{
            duration: 1.5,
          }}
        >
          <div
            ref={coreRef}
            data-ui={twData({
              available: !cartItem.invalid && !isLoading && !props.disabled,
            })}
            className='group/card dividy-y flex w-full gap-4 border-b border-stone-200 py-4 last:border-none data-not-available:pointer-events-none data-not-available:opacity-75 @2xl/cart:gap-6 @2xl/cart:py-6'
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
                  alt={
                    cartItem.commodityOnMenu.commodity.name ??
                    'food placeholder'
                  }
                />
              </div>
            </section>
            <div className='grid grow grid-cols-2'>
              {/* Content */}
              <section className='flex flex-col gap-2 rounded-md'>
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
                          )?.find((option) => option.name === optionName)
                            ?.order ?? Infinity,
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
                  <Listbox.Button
                    id={`reference-${cartItemId}`}
                    className='relative flex w-[5.5ch] items-center justify-start rounded-2xl border border-stone-200 py-1 hover:bg-stone-100 disabled:hover:bg-transparent'
                  >
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
                                    data-ui={twData({
                                      selected:
                                        quantity + 1 === cartItem.quantity,
                                    })}
                                    className={twMerge(
                                      'cursor-pointer rounded-xl px-1 py-1 text-center data-selected:bg-stone-100 hover:bg-stone-100 active:bg-stone-100',
                                      quantity === -1 && 'text-sm text-red-400',
                                    )}
                                  >
                                    {quantity === -1 ? '刪除' : quantity + 1}
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
                {/* Price */}
                <h3 className='whitespace-nowrap text-end font-bold'>
                  ${cartItem.commodityOnMenu.commodity.price}
                </h3>
              </section>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </SwipeToDelete>
  )
}

export default memo(CartItemCard)

function SwipeToDelete(props: {
  children: JSX.Element
  portalId: string
  onDelete: () => void
  coreRef: React.RefObject<HTMLElement>
  referenceElement?: HTMLElement
  disabled?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rootRef.current || !props.coreRef.current) return
    const handleResize = () => {
      if (!rootRef.current || !props.coreRef.current) return
      rootRef.current.style.height = `${props.coreRef.current.offsetHeight}px`
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [rootRef, props.coreRef])

  // move portal to reference position
  const handleClick = () => {
    if (!rootRef.current || !props.referenceElement || !portalRef.current)
      return

    const buttonRect = props.referenceElement.getBoundingClientRect()
    const rootRect = rootRef.current.getBoundingClientRect()

    portalRef.current.style.top = `${
      buttonRect.y - rootRect.y + buttonRect.height
    }px`
    portalRef.current.style.left = `${buttonRect.x - rootRect.x}px`
    portalRef.current.style.width = `${buttonRect.width}px`
    portalRef.current.style.height = '0px'
  }

  const handleDelete = () => {
    if (props.disabled) return
    props.onDelete()
  }

  return (
    <div ref={rootRef} className='relative w-full' onClick={handleClick}>
      <div className='absolute inset-y-0 right-0 w-1/2 bg-red-400'></div>
      <div
        ref={scrollRef}
        className='absolute inset-0 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scrollbar-none'
      >
        <div className='relative flex h-full w-full'>
          <div className='w-full shrink-0 snap-end'>
            <div className='absolute flex w-full bg-white'>
              {props.children}
            </div>
          </div>
          <div className='w-4 shrink-0 bg-white'></div>
          <div
            className={twMerge(
              'flex w-1/5 shrink-0 cursor-pointer snap-end items-center justify-center bg-red-400 hover:bg-red-300 active:bg-red-300',
              props.disabled && 'bg-gray-400',
            )}
            onClick={handleDelete}
          >
            <p className='indent-[0.05em] tracking-wider text-white'>刪除</p>
          </div>
        </div>
      </div>
      <div
        id={props.portalId}
        className='absolute inset-0 w-0'
        ref={portalRef}
      ></div>
    </div>
  )
}
