import { useState, useEffect } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'

import trpc from '@/lib/client/trpc'
import type { CartItemsByMenu, InvalidCartItems } from '@/lib/client/trpc'
import { getMenuName } from '@/lib/common'
import Button from '@/components/core/Button'
import CartCard from './CartCard'
import Dialog from '@/components/core/Dialog'

export default function Cart() {
  const {
    data: cartData,
    isLoading: cartIsLoading,
    isError: cartIsError,
    error: cartError,
  } = trpc.menu.getCart.useQuery()
  const {
    data: userData,
    isLoading: userIsLoading,
    isError: userIsError,
    error: userError,
  } = trpc.user.get.useQuery(undefined)
  const [invalidCartItems, setInvalidCartItems] = useState<InvalidCartItems>([])
  const [cartItemsByMenu, setCartItemsByMenu] = useState<CartItemsByMenu>(
    new Map(),
  )
  const [modifiedNotify, setModifiedNotify] = useState(false)

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
    setInvalidCartItems(cartData.invalidCartItems)
    if (cartData.isModified) {
      setModifiedNotify(true)
    }
  }, [cartData])

  if (cartIsLoading || userIsLoading) return <div>Loading...</div>
  if (cartIsError || userIsError)
    return (
      <div className='text-red-400'>
        {cartError?.message}
        {userError?.message}
      </div>
    )

  return (
    <div className='relative h-full w-full @container/cart'>
      <div className='absolute inset-0 flex justify-center overflow-y-auto p-4 overflow-x-hidden scrollbar-thin scrollbar-thumb-stone-200 scrollbar-thumb-rounded-md lg:p-8'>
        <div className='grid h-min max-w-5xl grow gap-4 @2xl/cart:grid-cols-[3fr_2fr]'>
          {/* Header */}
          <h1 className='text-xl font-bold @2xl/cart:col-span-full'>
            購物車
            <span className='ml-1 text-lg font-normal text-stone-400'>
              {cartData.cartItems.length}
            </span>
          </h1>
          {/* CartItems */}
          <section className='flex flex-col gap-4 lg:pr-4'>
            {/* Invalid */}
            <div className='rounded-2xl bg-red-50 p-4 @2xl/cart:mx-0 @2xl/cart:p-6'>
              <h3 className='flex items-center gap-1 text-sm text-red-400'>
                <ExclamationTriangleIcon className='h-5 w-5 text-red-400' />
                以下餐點已失效
              </h3>
              <div>
                {invalidCartItems.length > 0 &&
                  invalidCartItems.map((cartItem) => (
                    <CartCard
                      key={`${cartItem.menuId}${cartItem.commodityId}${cartItem.optionsKey}`}
                      cartItem={cartItem}
                    />
                  ))}
              </div>
              <Button
                isLoading={true}
                isBusy={true}
                theme='support'
                className='mx-auto h-10 w-full max-w-[18ch] border border-red-200 px-4 text-red-400 data-busy:bg-red-100 hover:bg-red-100 data-busy:hover:bg-red-100 active:bg-red-100'
                textClassName='font-bold text-sm'
                label='清除失效餐點'
              />
            </div>
            {/* Valid */}
            {[...cartItemsByMenu].map(([menuId, menu]) => (
              <div key={menuId} className='flex flex-col'>
                <h3 className='text-sm text-stone-400'>{getMenuName(menu)}</h3>
                {menu.cartItems.map((cartItem) => (
                  <CartCard
                    key={`${cartItem.menuId}${cartItem.commodityId}${cartItem.optionsKey}`}
                    cartItem={cartItem}
                  />
                ))}
              </div>
            ))}
          </section>
          {/* Checkout */}
          <section>
            <div className='sticky top-0 flex h-min flex-col gap-4 rounded-2xl bg-stone-100 p-6 @2xl/cart:max-w-xs'>
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
                <div className='flex justify-between border-b border-stone-200 py-2 text-sm'>
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
    </div>
  )
}
