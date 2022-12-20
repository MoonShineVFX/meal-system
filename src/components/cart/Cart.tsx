import { useState, useEffect, useCallback } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import { Checkout } from './Checkout'

import trpc from '@/lib/client/trpc'
import type { CartItemsByMenu, CartItemsAndMenus } from '@/lib/client/trpc'
import { getMenuName } from '@/lib/common'
import Button from '@/components/core/Button'
import CartItemCard from './CartItemCard'
import Dialog from '@/components/core/Dialog'
import CartItemOptionsDialog from './CartItemOptionsDialog'
import type { CartItems } from '@/lib/client/trpc'

type CartDeleteType = 'ALL' | 'INVALID'

export default function Cart() {
  const {
    data: cartData,
    isLoading: cartIsLoading,
    isError: cartIsError,
    error: cartError,
  } = trpc.cart.get.useQuery()
  const deleteCartMutation = trpc.cart.delete.useMutation()
  const [cartItemsAndMenus, setCartItemsAndMenus] = useState<CartItemsAndMenus>(
    [],
  )
  const [modifiedNotify, setModifiedNotify] = useState(false)
  const [cartItemInOptionsDialog, setCartItemInOptionsDialog] =
    useState<CartItems[0]>()

  useEffect(() => {
    setModifiedNotify(false)
    if (!cartData) return

    // Separate cart items by menu
    let cartItemsByMenu: CartItemsByMenu = new Map()
    for (const cartItem of cartData.cartItems) {
      const menu = cartItem.commodityOnMenu.menu
      if (!cartItemsByMenu.has(cartItem.menuId)) {
        cartItemsByMenu.set(cartItem.menuId, { ...menu, cartItems: [cartItem] })
      } else {
        cartItemsByMenu.get(cartItem.menuId)!.cartItems.push(cartItem)
      }
    }

    // Sort cart items and flatten to array
    cartItemsByMenu = new Map([...cartItemsByMenu.entries()].sort())
    const cartItemsAndMenus: CartItemsAndMenus = []
    for (const [menuId, menu] of cartItemsByMenu) {
      const { cartItems, ...menuWithoutCartItems } = menu
      cartItemsAndMenus.push(
        { ...menuWithoutCartItems, id: menuId },
        ...cartItems.sort((a, b) => a.commodityId - b.commodityId),
      )
    }

    setCartItemsAndMenus(cartItemsAndMenus)

    if (cartData.isModified) {
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

  if (cartIsLoading) return <div>Loading...</div>
  if (cartIsError)
    return <div className='text-red-400'>{cartError?.message}</div>

  // Detect type of delete
  let deleteCartType: CartDeleteType | undefined = undefined
  if (deleteCartMutation.isLoading) {
    if (
      deleteCartMutation.variables &&
      deleteCartMutation.variables.invalidOnly
    )
      deleteCartType = 'INVALID'
    else {
      deleteCartType = 'ALL'
    }
  }

  return (
    <div className='relative h-full w-full @container/cart' tabIndex={0}>
      <div className='ms-scroll absolute inset-0 flex justify-center overflow-y-auto p-4 overflow-x-hidden lg:p-8'>
        <div className='grid h-min min-h-full max-w-3xl grow grid-rows-[min-content_auto_min-content] gap-4 @2xl/cart:grid-cols-[3fr_2fr] @2xl/cart:grid-rows-[min-content_auto] @2xl/cart:gap-x-8'>
          {/* Clear Button */}
          <div className='col-start-1 row-start-1 flex justify-end'>
            {cartData.cartItems.length > 0 && (
              <Button
                isBusy={deleteCartMutation.isLoading}
                isLoading={deleteCartMutation.isLoading}
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
            <h1 className='inline text-xl font-bold tracking-wider'>購物車</h1>
          </div>
          {/* CartItems */}
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
                      />
                    ))}
                </div>
                {/* Clear cart items */}
                <Button
                  isLoading={deleteCartType === 'INVALID'}
                  isBusy={
                    deleteCartMutation.isLoading || deleteCartMutation.isSuccess
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
                {cartItemsAndMenus.map((menuOrCartItem) => {
                  if ('menuId' in menuOrCartItem) {
                    return (
                      <CartItemCard
                        key={`${menuOrCartItem.menuId}${menuOrCartItem.commodityId}${menuOrCartItem.optionsKey}`}
                        cartItem={menuOrCartItem}
                        disabled={deleteCartType === 'ALL'}
                        onOptionsClick={setCartItemInOptionsDialog}
                      />
                    )
                  } else {
                    return (
                      <motion.h3
                        exit={{
                          opacity: 0,
                          transition: {
                            duration: 0.3,
                          },
                        }}
                        className='text-sm text-stone-400'
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
              {cartData.cartItems.length === 0 && (
                <motion.div
                  layout
                  key='empty'
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.3, type: 'spring' }}
                  className='absolute inset-0 flex flex-col items-center justify-center @2xl/cart:top-16 @2xl/cart:justify-start'
                >
                  <div className='flex flex-col items-center justify-center gap-2 sm:gap-4'>
                    <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
                      <ShoppingCartIcon className='h-12 w-12 text-stone-400' />
                    </div>
                    <h1 className='text-lg font-bold'>購物車是空的</h1>
                    <p className='text-center text-sm text-stone-400'>
                      購物車是空的，快去挑選餐點吧！
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
          {/* Checkout */}
          <section>
            <Checkout
              className={cartData.cartItems.length === 0 ? 'max-sm:hidden' : ''}
              totalPrice={cartData.cartItems.reduce(
                (acc: number, cartItem) =>
                  (acc +=
                    cartItem.commodityOnMenu.commodity.price *
                    cartItem.quantity),
                0,
              )}
            />
          </section>
        </div>
      </div>
      {/* Dialog warning */}
      <Dialog
        open={modifiedNotify}
        onClose={() => setModifiedNotify(false)}
        title='購物車有所更動'
        content='餐點內容在這段期間有所調整，因此購物車內的餐點數量產生異動或失效。'
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
