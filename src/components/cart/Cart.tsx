import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'
import { MenuType } from '@prisma/client'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'

import Button from '@/components/core/Button'
import Dialog from '@/components/core/Dialog'
import Error from '@/components/core/Error'
import type {
  CartItems,
  CartItemsAndMenus,
  CartItemsByMenu,
} from '@/lib/client/trpc'
import trpc from '@/lib/client/trpc'
import { getMenuName, getOrderOptionsPrice, twData } from '@/lib/common'
import CartItemCard from './CartItemCard'
import CartItemOptionsDialog from './CartItemOptionsDialog'
import Checkout from './Checkout'

type CartDeleteType = 'ALL' | 'INVALID'

const CARTITEM_SKELETON = {
  menuId: 0,
  commodityId: 0,
  optionsKey: '__skeleton',
  quantity: 1,
  options: { 0: '000', 1: '0000' },
  invalid: false,
  commodityOnMenu: {
    maxQuantity: 0,
    menu: {
      name: '',
      date: null,
      type: MenuType.LIVE,
      maxQuantity: 0,
    },
    commodity: {
      image: null,
      name: '00000',
      price: 100,
      imageId: null,
      optionSets: [],
    },
  },
}

export default function Cart() {
  const {
    data: cartData,
    isLoading: cartIsLoading,
    isError: cartIsError,
    error: cartError,
  } = trpc.cart.get.useQuery()
  const deleteCartMutation = trpc.cart.delete.useMutation({
    onSuccess: () => {
      deleteCartMutation.reset()
    },
  })
  const [modifiedNotify, setModifiedNotify] = useState(false)
  const [cartItemInOptionsDialog, setCartItemInOptionsDialog] =
    useState<CartItems[0]>()
  const cartItemsAndMenus = useMemo(() => {
    if (!cartData) return []

    // Separate cart items by menu and calculate correct menu maxQuantity
    let cartItemsByMenu: CartItemsByMenu = new Map()
    for (const cartItem of cartData.cartItems) {
      const menu = cartItem.commodityOnMenu.menu
      if (!cartItemsByMenu.has(cartItem.menuId)) {
        cartItemsByMenu.set(cartItem.menuId, {
          ...menu,
          cartItems: [cartItem],
          maxQuantity:
            menu.limitPerUser === 0
              ? Infinity
              : menu.limitPerUser - cartItem.quantity,
        })
      } else {
        cartItemsByMenu.get(cartItem.menuId)!.cartItems.push(cartItem)
        cartItemsByMenu.get(cartItem.menuId)!.maxQuantity -= cartItem.quantity
      }
    }

    // Sort cart items and flatten to array
    cartItemsByMenu = new Map([...cartItemsByMenu.entries()].sort())
    const cartItemsAndMenus: CartItemsAndMenus = []
    for (const [menuId, menu] of cartItemsByMenu) {
      const { cartItems, ...menuWithoutCartItems } = menu
      cartItemsAndMenus.push(
        { ...menuWithoutCartItems, id: menuId },
        ...cartItems
          .sort((a, b) => a.commodityId - b.commodityId)
          .map((c) => {
            c.commodityOnMenu.menu.maxQuantity = menu.maxQuantity
            return c
          }),
      )
    }

    return cartItemsAndMenus
  }, [cartData])

  useEffect(() => {
    setModifiedNotify(false)

    if (cartData && cartData.isModified) {
      setModifiedNotify(true)
    }
  }, [cartData])

  const handleDeleteInvalidCartItems = useCallback(() => {
    if (!cartData?.invalidCartItems.length) return
    deleteCartMutation.mutate({ invalidOnly: true })
  }, [cartData?.invalidCartItems.length, deleteCartMutation])

  const handleDeleteAllCartItems = useCallback(() => {
    if (!cartData?.cartItems.length) return
    deleteCartMutation.mutate({})
  }, [cartData?.cartItems.length, deleteCartMutation])

  if (cartIsError) return <Error description={cartError.message} />

  // Detect type of delete
  let deleteCartType: CartDeleteType | undefined = undefined
  if (deleteCartMutation.isPending) {
    if (
      deleteCartMutation.variables &&
      deleteCartMutation.variables.invalidOnly
    )
      deleteCartType = 'INVALID'
    else {
      deleteCartType = 'ALL'
    }
  }

  // cart item has 0 count bug
  const isCartItemCountZero = useMemo(() => {
    if (!cartData) return false
    return cartData.cartItems.some((cartItem) => cartItem.quantity === 0)
  }, [cartData])

  return (
    <div
      className='group relative h-full w-full @container/cart'
      tabIndex={0}
      {...twData({ loading: cartIsLoading })}
    >
      <div className='ms-scroll absolute inset-0 flex justify-center overflow-y-auto overflow-x-hidden'>
        <div className='grid h-min min-h-full max-w-5xl grow grid-rows-[min-content_auto_min-content] gap-4 bg-white p-4 @2xl/cart:grid-cols-[3fr_2fr] @2xl/cart:grid-rows-[min-content_auto] @2xl/cart:gap-x-8 @2xl/cart:gap-y-8 @6xl/cart:gap-x-24 lg:p-8'>
          {/* Clear Button */}
          <div className='col-start-1 row-start-1 flex justify-end'>
            {cartData && cartData.cartItems.length > 0 && (
              <Button
                isBusy={deleteCartMutation.isPending}
                isLoading={deleteCartMutation.isPending}
                label='清空購物車'
                theme='support'
                className='h-7 w-[11ch] self-end border border-stone-100'
                textClassName='text-sm text-stone-400'
                spinnerClassName='h-5 w-5'
                onClick={handleDeleteAllCartItems}
              />
            )}
          </div>
          {/* Header */}
          <div className='pointer-events-none col-start-1 row-start-1 justify-between @2xl/cart:col-span-full'>
            <h1 className='inline rounded-xl text-xl font-bold tracking-wider group-data-loading:skeleton'>
              購物車
            </h1>
          </div>
          {/* CartItems */}
          {cartIsLoading || !cartData ? (
            // Skeleton
            <section className='flex flex-col'>
              {[...Array(3).keys()].map((i) => (
                <CartItemCard
                  key={`${i}`}
                  cartItem={CARTITEM_SKELETON}
                  isDisabled={true}
                />
              ))}
            </section>
          ) : (
            <section className='relative flex flex-col gap-4'>
              {/* Invalid */}
              {cartData.invalidCartItems.length > 0 && (
                <div className='rounded-2xl bg-red-50 p-4 @2xl/cart:mx-0 @2xl/cart:p-6'>
                  <h3 className='flex items-center gap-1 text-sm text-red-400'>
                    <ExclamationTriangleIcon className='h-5 w-5 text-red-400' />
                    以下餐點已失效
                  </h3>
                  <div>
                    {cartData.invalidCartItems.length > 0 &&
                      cartData.invalidCartItems.map((cartItem) => (
                        <CartItemCard
                          key={`${cartItem.menuId}${cartItem.commodityId}${cartItem.optionsKey}`}
                          cartItem={cartItem}
                          isInvalid
                        />
                      ))}
                  </div>
                  {/* Clear cart items */}
                  <Button
                    isLoading={deleteCartType === 'INVALID'}
                    isBusy={
                      deleteCartMutation.isPending ||
                      deleteCartMutation.isSuccess
                    }
                    isSuccess={deleteCartMutation.isSuccess}
                    labelOnSuccess='清除成功'
                    theme='support'
                    className='mx-auto h-10 w-full max-w-[18ch] border border-red-200 px-4 text-red-400 data-busy:bg-red-100 hover:bg-red-100 data-busy:hover:bg-red-100 active:bg-red-100'
                    textClassName='font-bold text-sm'
                    label='清除失效餐點'
                    onClick={handleDeleteInvalidCartItems}
                  />
                </div>
              )}
              {/* Valid */}
              <div className='flex flex-col'>
                <AnimatePresence initial={false}>
                  {cartItemsAndMenus.map((menuOrCartItem, i) => {
                    if ('menuId' in menuOrCartItem) {
                      return (
                        <CartItemCard
                          key={`${menuOrCartItem.menuId}${menuOrCartItem.commodityId}${menuOrCartItem.optionsKey}`}
                          cartItem={menuOrCartItem}
                          isDisabled={deleteCartType === 'ALL'}
                          onOptionsClick={setCartItemInOptionsDialog}
                        />
                      )
                    } else {
                      return (
                        <motion.h3
                          layout
                          exit={{
                            opacity: 0,
                            transition: {
                              duration: 0.3,
                            },
                          }}
                          transition={{ duration: 0.2 }}
                          className='pt-4 text-sm text-stone-400 first:pt-0'
                          key={menuOrCartItem.id}
                        >
                          {getMenuName(menuOrCartItem)}
                        </motion.h3>
                      )
                    }
                  })}
                </AnimatePresence>
              </div>
              {/* Empty */}
              <AnimatePresence initial={false}>
                {cartData.cartItems.length +
                  cartData.invalidCartItems.length ===
                  0 && (
                  <motion.div
                    layout
                    key='empty'
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3, type: 'spring' }}
                    className='absolute inset-0 flex flex-col items-center justify-center @2xl/cart:top-16 @2xl/cart:justify-start'
                  >
                    <div className='flex flex-col items-center justify-center gap-4'>
                      <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
                        <ShoppingCartIcon className='h-12 w-12 text-stone-400' />
                      </div>
                      <h1 className='-indent-[0.1em] text-lg font-bold tracking-widest text-stone-500'>
                        購物車是空的
                      </h1>
                      <p className='-mt-2 text-center text-sm text-stone-400'>
                        快去挑選餐點吧！
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
          {/* Checkout */}
          <section>
            <Checkout
              isLoading={cartIsLoading}
              isDisabled={
                !cartData ||
                cartData.cartItems.length === 0 ||
                isCartItemCountZero
              }
              className={
                cartData && cartData.cartItems.length === 0
                  ? 'max-sm:hidden'
                  : ''
              }
              totalPrice={
                cartData
                  ? cartData.cartItems.reduce(
                      (acc: number, cartItem) =>
                        (acc +=
                          getOrderOptionsPrice(
                            cartItem.options,
                            cartItem.commodityOnMenu.commodity.optionSets,
                            cartItem.commodityOnMenu.commodity.price,
                          ) * cartItem.quantity),
                      0,
                    )
                  : 0
              }
            />
          </section>
        </div>
      </div>
      {/* Dialog warning */}
      <Dialog
        open={modifiedNotify}
        onClose={() => setModifiedNotify(false)}
        title='購物車內容更動'
        content='餐點在這段期間有調整，或有新增的餐點與購物車原本餐點衝突。因此購物車內的餐點有數量異動或失效。'
      />
      {/* Cartitem options */}
      <CartItemOptionsDialog
        open={!!cartItemInOptionsDialog}
        onClose={() => setCartItemInOptionsDialog(undefined)}
        cartItem={cartItemInOptionsDialog}
      />
    </div>
  )
}
