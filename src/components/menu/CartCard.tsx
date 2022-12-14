import type { CartItems, InvalidCartItems } from '@/lib/client/trpc'
import Image from '@/components/core/Image'
import { OrderOptions, settings, twData } from '@/lib/common'

export default function CartCard(props: {
  cartItem: CartItems[0] | InvalidCartItems[0]
  disabled?: boolean
}) {
  const { cartItem } = props

  const handleQuantityChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    console.log(event.target.value)
  }

  return (
    <div
      data-ui={twData({ available: !cartItem.invalid })}
      className='group/card flex w-full justify-between gap-4 border-b border-stone-200 py-4 first:border-y last:border-none data-not-available:pointer-events-none data-not-available:opacity-75'
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
      {/* Content */}
      <section className='relative flex flex-1 cursor-pointer flex-col gap-2 rounded-md hover:bg-stone-100 active:bg-stone-100'>
        {/* Name */}
        <h2 className='font-bold tracking-wider'>
          {cartItem.commodityOnMenu.commodity.name}
        </h2>
        {/* Options */}
        {Object.keys(cartItem.options as OrderOptions).length > 0 && (
          <div className='flex flex-col gap-1'>
            {Object.values(cartItem.options as OrderOptions)
              .flatMap((optionValue) =>
                Array.isArray(optionValue) ? optionValue : [optionValue],
              )
              .map((optionValue) => (
                <span
                  key={optionValue}
                  className='whitespace-nowrap text-xs text-stone-400'
                >
                  {optionValue}
                </span>
              ))}
          </div>
        )}
      </section>
      {/* Quantity and remove*/}
      {cartItem.invalid ? (
        <section>
          <div>{cartItem.quantity}</div>
        </section>
      ) : (
        <section className='flex flex-col'>
          <select
            value={cartItem.quantity}
            className='rounded-2xl border border-stone-200 py-1 px-2 text-left text-sm focus:outline-none'
            onChange={handleQuantityChange}
          >
            {[
              -1,
              ...Array(
                Math.min(
                  (cartItem as CartItems[0]).commodityOnMenu.commodity
                    .maxQuantity,
                  settings.MENU_MAX_ORDER_QUANTITY,
                ),
              ).keys(),
            ].map((quantity) => (
              <option value={quantity + 1} key={quantity}>
                {quantity === -1 ? '刪除' : quantity + 1}
              </option>
            ))}
          </select>
        </section>
      )}

      {/* Price */}
      <section className='w-[5ch]'>
        <h3 className='whitespace-nowrap text-end'>
          ${cartItem.commodityOnMenu.commodity.price}
        </h3>
      </section>
    </div>
  )
}
