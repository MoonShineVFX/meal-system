import { useCallback, useState } from 'react'

import { OrderStatus, settings } from '@/lib/common'
import POSCard from './POSCard'
import Dialog from '@/components/core/Dialog'
import trpc, { POSReservationDatas } from '@/lib/client/trpc'
import Image from '@/components/core/Image'

export default function POSReservationCard(props: {
  com?: POSReservationDatas[number]['coms'][number]
  isFuture?: boolean
}) {
  const { com } = props
  const [activeOptionsWithOrders, setActiveOptionsWithOrders] = useState<
    | POSReservationDatas[number]['coms'][number]['optionsWithOrders'][number]
    | null
  >(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const updateOrdersMutation = trpc.pos.updateReservation.useMutation()

  const handleStatusModify = useCallback(
    (status: OrderStatus) => {
      if (com === undefined) return
      updateOrdersMutation.mutate({
        orderIds: com.orderIds,
        status,
      })
    },
    [com],
  )

  return (
    <POSCard
      order={
        com
          ? {
              timeCanceled: com.orderTimes.timeCanceled.value,
              timeCompleted: com.orderTimes.timeCompleted.value,
              timeDishedUp: com.orderTimes.timeDishedUp.value,
              timePreparing: com.orderTimes.timePreparing.value,
            }
          : undefined
      }
      header={com?.name ?? '預訂餐點'}
      metadata={
        <div className='flex h-fit items-center justify-between rounded-xl text-sm font-bold tracking-wider text-stone-600/50 group-data-loading:skeleton'>
          <p>{`總共 ${com?.totalQuantity ?? 1} 份`}</p>
        </div>
      }
      onStatusModify={handleStatusModify}
      isLoading={updateOrdersMutation.isLoading}
      disableAnimation={true}
      disableStatusButton={props.isFuture}
    >
      {/* Options */}
      <div className='flex grow flex-col gap-3'>
        {(com ? com.optionsWithOrders : [undefined]).map(
          (optionWithOrders, index) => (
            <button
              key={index}
              className='-m-1 flex justify-between rounded-lg p-1 font-bold hover:bg-stone-600/10 active:scale-95 active:bg-stone-600/10'
              onClick={() => {
                if (optionWithOrders === undefined) return
                setActiveOptionsWithOrders(optionWithOrders)
                setIsDialogOpen(true)
              }}
              title='查看點餐名單'
            >
              <div className='flex flex-wrap gap-2 gap-y-0'>
                {(optionWithOrders &&
                  Object.keys(optionWithOrders).length === 0) ||
                !optionWithOrders ? (
                  <p className='rounded-xl group-data-loading:skeleton'>
                    無細項
                  </p>
                ) : (
                  Object.values(optionWithOrders.option).map((value, index) => (
                    <p key={index}>
                      {Array.isArray(value) ? value.join(', ') : value}
                    </p>
                  ))
                )}
              </div>
              <p className='whitespace-nowrap rounded-xl group-data-loading:skeleton'>{`x ${
                optionWithOrders?.quantity ?? 1
              }`}</p>
            </button>
          ),
        )}
      </div>
      {/* Dialog */}
      <Dialog
        open={isDialogOpen && activeOptionsWithOrders !== null}
        onClose={() => setIsDialogOpen(false)}
        icon={null}
        title={
          activeOptionsWithOrders &&
          Object.keys(activeOptionsWithOrders).length > 0
            ? Object.entries(activeOptionsWithOrders.option)
                .filter(
                  ([, value]) => !Array.isArray(value) || value.length > 0,
                )
                .map(([key, value]) => `${key}: ${value}`)
                .join(' / ')
            : '無細項'
        }
        contentClassName='w-full pt-4'
        content={
          <div className='ms-scroll flex max-h-[50vh] justify-center overflow-y-auto'>
            <div className='grid w-fit grid-cols-2 gap-4'>
              {activeOptionsWithOrders
                ? activeOptionsWithOrders.orders.map((userOrder, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between gap-2 whitespace-nowrap text-base'
                    >
                      {/* info */}
                      <div className='flex items-center gap-2'>
                        <div className='relative h-8 w-8 overflow-hidden rounded-full'>
                          <Image
                            className='object-cover'
                            alt='profile'
                            src={
                              userOrder.user.profileImage
                                ? userOrder.user.profileImage.path
                                : settings.RESOURCE_PROFILE_PLACEHOLDER
                            }
                            sizes='24px'
                          />
                        </div>
                        <h2 className='tracking-wider text-stone-400'>
                          {userOrder.user.name}
                        </h2>
                      </div>
                      {/* quantity */}
                      <p className='w-[4ch] font-bold tracking-wider text-stone-400'>
                        {`x ${userOrder.quantity}`}
                      </p>
                    </div>
                  ))
                : null}
            </div>
          </div>
        }
      />
    </POSCard>
  )
}
