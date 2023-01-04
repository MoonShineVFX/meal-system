import { useCallback, useState } from 'react'

import { OrderStatus, settings } from '@/lib/common'
import POSCard from './POSCard'
import Dialog from '@/components/core/Dialog'
import trpc, { POSReservationDatas } from '@/lib/client/trpc'
import Image from '@/components/core/Image'

export default function POSReservationCard(props: {
  com: POSReservationDatas[number]['coms'][number]
}) {
  const { com } = props
  const [activeOptionsWithOrders, setActiveOptionsWithOrders] = useState<
    typeof com['optionsWithOrders'][number] | null
  >(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const updateOrdersMutation = trpc.pos.updateReservation.useMutation()

  const handleStatusModify = useCallback(
    (status: OrderStatus) => {
      updateOrdersMutation.mutate({
        orderIds: com.orderIds,
        status,
      })
    },
    [com],
  )

  return (
    <POSCard
      order={{
        timeCanceled: com.orderTimes.timeCanceled.value,
        timeCompleted: com.orderTimes.timeCompleted.value,
        timeDishedUp: com.orderTimes.timeDishedUp.value,
        timePreparing: com.orderTimes.timePreparing.value,
      }}
      header={com.name}
      metadata={
        <div className='flex items-center justify-between text-sm font-bold tracking-wider text-stone-600/50'>
          <p>{`總共 ${com.totalQuantity} 份`}</p>
        </div>
      }
      key={com.id}
      onStatusModify={handleStatusModify}
      isLoading={updateOrdersMutation.isLoading}
      disableAnimation={true}
    >
      {/* Options */}
      <div className='flex grow flex-col gap-3'>
        {com.optionsWithOrders.map((optionWithOrders, index) => (
          <button
            key={index}
            className='-m-1 flex justify-between rounded-lg p-1 font-bold hover:bg-stone-600/10 active:scale-95 active:bg-stone-600/10'
            onClick={() => {
              setActiveOptionsWithOrders(optionWithOrders)
              setIsDialogOpen(true)
            }}
          >
            <div className='flex flex-wrap gap-2 gap-y-0'>
              {Object.keys(optionWithOrders).length === 0 ? (
                <p>無細項</p>
              ) : (
                Object.values(optionWithOrders.option).map((value, index) => (
                  <p key={index}>
                    {Array.isArray(value) ? value.join(', ') : value}
                  </p>
                ))
              )}
            </div>
            <p className='whitespace-nowrap'>{`x ${optionWithOrders.quantity}`}</p>
          </button>
        ))}
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
