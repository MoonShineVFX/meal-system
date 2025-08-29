import { useCallback } from 'react'

import Image from '@/components/core/Image'
import trpc, { POSLiveDatas } from '@/lib/client/trpc'
import { getOptionName, OrderTimeStatus, settings } from '@/lib/common'
import POSCard from './POSCard'

export default function POSLiveCard(props: {
  order?: POSLiveDatas[0]
  isArchived?: boolean
}) {
  const { order } = props
  const updateOrderMutation = trpc.pos.update.useMutation()

  const handleStatusModify = useCallback(
    (status: OrderTimeStatus) => {
      if (order === undefined) return
      updateOrderMutation.mutate({ orderId: order.id, status })
    },
    [order, updateOrderMutation],
  )

  // split order id to 3 digits
  const orderId = order?.id.toString().slice(-3) ?? 123
  let prefixOrderId = ''
  if (order?.id.toString().length ?? 0 > 3) {
    prefixOrderId = order?.id.toString().slice(0, -3).toString() ?? ''
  }

  return (
    <POSCard
      order={order}
      header={
        <>
          <span className='text-sm text-stone-400'>#{prefixOrderId}</span>
          {orderId}
        </>
      }
      metadata={
        <div className='flex items-center gap-2'>
          <div className='relative h-6 w-6 overflow-hidden rounded-full group-data-loading:skeleton'>
            <Image
              className='object-cover group-data-loading:hidden'
              alt='profile'
              src={
                order?.user.profileImage
                  ? order.user.profileImage.path
                  : settings.RESOURCE_PROFILE_PLACEHOLDER
              }
              sizes='24px'
            />
          </div>
          <h2 className='rounded-xl text-sm tracking-wider text-stone-600/60 group-data-loading:skeleton'>
            {order?.user.name ?? '使用者'}
          </h2>
        </div>
      }
      disableAnimation={props.isArchived}
      disableInteraction={props.isArchived}
      onStatusModify={handleStatusModify}
      isLoading={updateOrderMutation.isPending}
      print={
        order && order.timePreparing !== null
          ? {
              date: order.timePreparing,
              items: order.items
                .flatMap((item) =>
                  [...Array(item.quantity).keys()].map(() => ({
                    orderId: order.id,
                    name: item.name,
                    user: order.user.name,
                    options: Object.values(item.options).flat(),
                  })),
                )
                .map((item, i) => ({
                  ...item,
                  index: [
                    i + 1,
                    order.items.reduce((a, b) => a + b.quantity, 0),
                  ],
                })),
            }
          : undefined
      }
    >
      {/* Items */}
      <section className='flex grow flex-col gap-4'>
        {(order?.items ?? ([...Array(2).fill(undefined)] as undefined[])).map(
          (item, index) => (
            <div key={item?.id ?? index} className='flex flex-col gap-1'>
              {/* Name and quantity */}
              <div className='flex justify-between text-lg font-bold tracking-wider'>
                <p className='rounded-xl group-data-loading:skeleton'>
                  {item?.name ?? '各種餐點'}
                </p>
                <p className='rounded-xl group-data-loading:skeleton'>{`x ${
                  item?.quantity ?? 1
                }`}</p>
              </div>
              {/* Options */}
              <div className='flex w-3/5 flex-wrap gap-3 text-stone-500'>
                {(item
                  ? Object.values(item.options).flatMap((optionValue) =>
                      Array.isArray(optionValue) ? optionValue : [optionValue],
                    )
                  : ([...Array(2).fill(undefined)] as undefined[])
                ).map((optionValue, index) => (
                  <p
                    className='rounded-xl group-data-loading:skeleton'
                    key={optionValue ? getOptionName(optionValue) : index}
                  >
                    {optionValue ? getOptionName(optionValue) : '選項'}
                  </p>
                ))}
              </div>
            </div>
          ),
        )}
      </section>
    </POSCard>
  )
}
