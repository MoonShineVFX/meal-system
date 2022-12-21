import Error from '@/components/core/Error'
import trpc from '@/lib/client/trpc'
import { getMenuName } from '@/lib/common'
import OrderItemList from '@/components/order/OrderItemList'

export default function PageOrder() {
  const { data, isError, error, isLoading } = trpc.order.get.useQuery()

  if (isLoading) {
    return <div>Loading...</div>
  }
  if (isError) {
    return <Error description={error.message} />
  }

  return (
    <div className='relative h-full w-full'>
      <div className='ms-scroll absolute inset-0 overflow-auto p-4'>
        <ul className='flex flex-col gap-4'>
          {data.map((order) => {
            const payment = order.transactions.find(
              (transaction) => transaction.type === 'PAYMENT',
            )
            return (
              <li
                className='flex flex-col gap-4 rounded-2xl border p-4 shadow-md'
                key={order.id}
              >
                {/* Header */}
                <header className='flex items-center gap-2'>
                  <span className='font-bold'>#{order.id}</span>
                  <span className='text-sm tracking-wider text-stone-500'>
                    {getMenuName(order.menu)}
                  </span>
                  <span className='grow text-right'>
                    {`$${
                      (payment?.creditAmount ?? 0) + (payment?.pointAmount ?? 0)
                    }`}
                  </span>
                </header>
                {/* Content */}
                <OrderItemList orderItems={order.items} />
                {/* Progress */}
                <footer className='flex flex-col gap-4'>
                  {/* bar */}
                  <section className='relative h-1.5 rounded-full bg-gray-200'>
                    <div className='absolute inset-y-0 w-1/2 rounded-full bg-yellow-500'></div>
                    {/* Dot */}
                    <div className='absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-500 shadow-lg'>
                      <div className='absolute inset-0 scale-125 animate-ping rounded-full bg-yellow-500'></div>
                    </div>
                  </section>
                  {/* Text */}
                  <div className='grid grid-cols-3 text-sm tracking-wider'>
                    <span>付款</span>
                    <span className='text-center indent-[0.05em] text-yellow-600'>
                      製作中
                    </span>
                    <span className='text-right text-stone-300'>可取餐</span>
                  </div>
                </footer>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
