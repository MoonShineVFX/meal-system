import { useCallback, useState, useMemo } from 'react'

import { OrderStatus, getOptionName, settings } from '@/lib/common'
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
  const printProps = useMemo(() => {
    if (
      props.isFuture ||
      com === undefined ||
      com.orderTimes.timePreparing.value === null
    )
      return undefined

    const printItemByOrderId: Record<
      number,
      Omit<
        NonNullable<Parameters<typeof POSCard>[0]['print']>['items'][number],
        'index'
      >[]
    > = {}
    for (const orderItem of com.orderItems) {
      for (let qidx = 0; qidx < orderItem.quantity; qidx++) {
        if (!(orderItem.order.id in printItemByOrderId)) {
          printItemByOrderId[orderItem.order.id] = []
        }
        printItemByOrderId[orderItem.order.id].push({
          orderId: orderItem.order.id,
          name: com.name,
          user: orderItem.order.user.name,
          options: Object.values(orderItem.options).flat(),
        })
      }
    }

    return {
      date: com.orderTimes.timePreparing.value,
      items: Object.values(printItemByOrderId)
        .flatMap((items) =>
          items.map((item, i) => ({
            index: [i + 1, items.length] as [number, number],
            ...item,
          })),
        )
        .sort((a, b) =>
          (a.options?.join('_') ?? '').localeCompare(
            b.options?.join('_') ?? '',
          ),
        ),
    }
  }, [com, props.isFuture, com?.orderTimes.timePreparing.value])

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
      print={printProps}
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
                  Object.keys(optionWithOrders.option).length === 0) ||
                !optionWithOrders ? (
                  <p className='rounded-xl group-data-loading:skeleton'>
                    無細項
                  </p>
                ) : (
                  Object.values(optionWithOrders.option).map((value, index) => (
                    <p key={index}>
                      {Array.isArray(value)
                        ? value.map((v) => getOptionName(v)).join(', ')
                        : getOptionName(value)}
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
          Object.keys(activeOptionsWithOrders.option).length > 0
            ? Object.entries(activeOptionsWithOrders.option)
                .filter(
                  ([, value]) => !Array.isArray(value) || value.length > 0,
                )
                .map(([key, value]) => `${key}: ${value}`)
                .join(' / ')
            : '無細項'
        }
        contentClassName='w-full pt-4'
        confirmText='返回'
        confirmButtonTheme='support'
        content={
          <DialogContent activeOptionsWithOrders={activeOptionsWithOrders} />
        }
      />
    </POSCard>
  )
}

function DialogContent(props: {
  activeOptionsWithOrders:
    | POSReservationDatas[number]['coms'][number]['optionsWithOrders'][number]
    | null
}) {
  const { activeOptionsWithOrders } = props

  return (
    <div className='flex max-h-[50vh] flex-col justify-center gap-4 overflow-y-auto'>
      <div className='ms-scroll grid w-fit grid-cols-2 gap-4'>
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
  )
}
