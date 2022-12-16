import { useState, useEffect, useCallback } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { twMerge } from 'tailwind-merge'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'

import trpc from '@/lib/client/trpc'
import type { CartItemsByMenu } from '@/lib/client/trpc'
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
  const {
    data: userData,
    isLoading: userIsLoading,
    isError: userIsError,
    error: userError,
  } = trpc.user.get.useQuery(undefined)
  const deleteCartMutation = trpc.cart.delete.useMutation()
  const [cartItemsByMenu, setCartItemsByMenu] = useState<CartItemsByMenu>(
    new Map(),
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

    // Sort cart items
    cartItemsByMenu = new Map([...cartItemsByMenu.entries()].sort())
    for (const [, menu] of cartItemsByMenu) {
      menu.cartItems = menu.cartItems.sort(
        (a, b) => a.commodityId - b.commodityId,
      )
    }

    setCartItemsByMenu(cartItemsByMenu)
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

  if (cartIsLoading || userIsLoading) return <div>Loading...</div>
  if (cartIsError || userIsError)
    return (
      <div className='text-red-400'>
        {cartError?.message}
        {userError?.message}
      </div>
    )
  if (cartData.cartItems.length + cartData.invalidCartItems.length === 0)
    return (
      <div className='flex h-full w-full flex-col items-center justify-center'>
        <div className='flex flex-col items-center justify-center gap-4'>
          <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100'>
            <ShoppingCartIcon className='h-12 w-12 text-stone-400' />
          </div>
          <h1 className='text-lg font-bold'>購物車是空的</h1>
          <p className='text-center text-sm text-stone-400'>
            購物車是空的，快去挑選餐點吧！
          </p>
        </div>
      </div>
    )

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
    <div className='relative h-full w-full @container/cart'>
      <div className='ms-scroll absolute inset-0 flex justify-center overflow-y-auto p-4 overflow-x-hidden lg:p-8'>
        <div className='grid h-min max-w-3xl grow gap-4 @2xl/cart:grid-cols-[3fr_2fr]'>
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
            <h1 className='inline text-xl font-bold'>購物車</h1>
          </div>
          {/* CartItems */}
          <section className='flex flex-col gap-4 @2xl/cart:pr-4'>
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
            {[...cartItemsByMenu].map(([menuId, menu]) => (
              <div key={menuId} className='flex flex-col'>
                <h3 className='text-sm text-stone-400'>{getMenuName(menu)}</h3>
                {menu.cartItems.map((cartItem) => (
                  <CartItemCard
                    key={`${cartItem.menuId}${cartItem.commodityId}${cartItem.optionsKey}`}
                    cartItem={cartItem}
                    disabled={deleteCartType === 'ALL'}
                    onOptionsClick={setCartItemInOptionsDialog}
                  />
                ))}
              </div>
            ))}
          </section>
          {/* Checkout */}
          <section>
            <div
              className={twMerge(
                'sticky top-0 flex h-min flex-col gap-4 rounded-2xl bg-stone-100 p-6',
                cartData.cartItems.length === 0 && 'hidden',
              )}
            >
              <h2 className='text-xl font-bold'>結帳</h2>
              <section className='flex flex-col text-stone-500'>
                {/* Total */}
                <div className='flex justify-between border-b border-stone-200 py-2 text-sm'>
                  <p>總計</p>
                  <p>
                    $
                    {cartData.cartItems.reduce(
                      (acc: number, cartItem) =>
                        (acc +=
                          cartItem.commodityOnMenu.commodity.price *
                          cartItem.quantity),
                      0,
                    )}
                  </p>
                </div>
                {/* Point balance */}
                {userData.pointBalance > 0 && (
                  <div className='flex justify-between border-b border-stone-200 py-2 text-sm'>
                    <p>點數</p>
                    <p>{userData.pointBalance}</p>
                  </div>
                )}
                {/* Credit balance */}
                <div className='flex justify-between  border-stone-200 py-2 text-sm'>
                  <p>夢想幣</p>
                  <p>${userData.creditBalance}</p>
                </div>
              </section>
              {/* Checkout button */}
              <Button label='確認付款' className='h-12 text-lg font-bold' />
            </div>
          </section>
        </div>
        <Dialog
          open={modifiedNotify}
          onClose={() => setModifiedNotify(false)}
          title='購物車有所更動'
          content='餐點內容在這段期間有所調整，因此購物車內的餐點數量產生異動或失效。'
        />
      </div>
      <CartItemOptionsDialog
        open={!!cartItemInOptionsDialog}
        onClose={() => setCartItemInOptionsDialog(undefined)}
        cartItem={cartItemInOptionsDialog}
      />
    </div>
  )
}