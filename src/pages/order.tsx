import Error from '@/components/core/Error'
import trpc from '@/lib/client/trpc'
import OrderCard from '@/components/order/OrderCard'

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
      <div className='ms-scroll absolute inset-0 flex justify-center overflow-auto'>
        <section className='flex h-max min-h-full w-full flex-col shadow-lg lg:max-w-3xl'>
          <div className='p-4 pb-0 lg:p-8 lg:pb-0'>
            {/* Header */}
            <h1 className='text-xl font-bold tracking-wider'>訂單</h1>
          </div>
          {/* Orders */}
          <div className='flex flex-col'>
            {data.map((order) => (
              <OrderCard order={order} key={order.id} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
