import trpc from '@/lib/client/trpc'
import { OrderOptions } from '@/lib/common'

export default function Cart() {
  const { data, isLoading, isError, error } = trpc.menu.getCart.useQuery()

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div className='text-red-400'>{error?.message}</div>

  return (
    <div className='relative h-full w-full'>
      <div className='absolute inset-0 overflow-auto'>
        <p>{data.isModified ? 'modified' : 'not-nodified'}</p>
        {data.cartItems.map((cartItem) => (
          <div
            key={`${cartItem.menuId}${cartItem.commodityId}${cartItem.optionsKey}`}
          >
            <p>
              {cartItem.commodityOnMenu.commodity.name} - {cartItem.quantity}
            </p>
            <p>{JSON.stringify(cartItem.options as OrderOptions)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
