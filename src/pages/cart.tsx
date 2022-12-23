import Cart from '@/components/cart/Cart'
import Title from '@/components/core/Title'

export default function CartPage() {
  return (
    <>
      <Title prefix='購物車' />
      <div className='h-full w-full bg-stone-50'>
        <Cart />
      </div>
    </>
  )
}
