import { Prisma, Order, MenuType, Menu } from '@prisma/client'
import { logError } from './define'

import {
  ConvertPrismaJson,
  settings,
  MenuTypeName,
  generateOptionsKey,
  OrderOptions,
  OrderStatus,
  ORDER_STATUS,
} from '@/lib/common'
import { getCartItemsBase } from './cart'
import { chargeUserBalanceBase, rechargeUserBalanceBase } from './transaction'
import { prisma } from './define'

/* Validate and create orders by menu with transaction */
export async function createOrder({ userId }: { userId: string }) {
  return await prisma.$transaction(async (client) => {
    // Get valid cart items
    const getCartItemsResult = await getCartItemsBase({ userId, client })
    const totalPrice = getCartItemsResult.cartItems.reduce(
      (acc, cur) => acc + cur.commodityOnMenu.commodity.price * cur.quantity,
      0,
    )

    // Charge user balance
    const { transaction } = await chargeUserBalanceBase({
      userId,
      amount: totalPrice,
      client,
    })

    // create order items and group by menu, reservation menu will group by commodity
    const orderItemCreates = getCartItemsResult.cartItems.reduce(
      (
        acc: Map<
          number,
          | Prisma.OrderItemCreateManyOrderInput[]
          | Map<number, Prisma.OrderItemCreateManyOrderInput[]>
        >,
        cartItem,
      ) => {
        // Reservation menu will separate orders by commodity
        if (cartItem.commodityOnMenu.menu.date !== null) {
          if (!acc.has(cartItem.menuId)) {
            acc.set(cartItem.menuId, new Map())
          }
          const thisMap = acc.get(cartItem.menuId) as Map<
            number,
            Prisma.OrderItemCreateManyOrderInput[]
          >
          if (!thisMap.has(cartItem.commodityId)) {
            thisMap.set(cartItem.commodityId, [])
          }

          thisMap.get(cartItem.commodityId)?.push({
            name: cartItem.commodityOnMenu.commodity.name,
            price: cartItem.commodityOnMenu.commodity.price,
            quantity: cartItem.quantity,
            options: cartItem.options,
            menuId: cartItem.menuId,
            commodityId: cartItem.commodityId,
            imageId: cartItem.commodityOnMenu.commodity.imageId,
          })
        } else {
          // Common menu
          if (!acc.has(cartItem.menuId)) {
            acc.set(cartItem.menuId, [])
          }

          ;(
            acc.get(cartItem.menuId) as Prisma.OrderItemCreateManyOrderInput[]
          ).push({
            name: cartItem.commodityOnMenu.commodity.name,
            price: cartItem.commodityOnMenu.commodity.price,
            quantity: cartItem.quantity,
            options: cartItem.options,
            menuId: cartItem.menuId,
            commodityId: cartItem.commodityId,
            imageId: cartItem.commodityOnMenu.commodity.imageId,
          })
        }
        return acc
      },
      new Map(),
    )

    // Create orders
    let orders: {
      id: number
      user: {
        name: string
      }
      menu: {
        date: Date | null
        type: MenuType
      }
    }[] = []
    for (const [menuId, value] of orderItemCreates) {
      // Reservation menu will separate orders by commodity
      const orderItemsGroups: Prisma.OrderItemCreateManyOrderInput[][] =
        Array.isArray(value)
          ? [value]
          : [...value].map(([, orderItems]) => orderItems)

      for (const orderItems of orderItemsGroups) {
        const order = await client.order.create({
          data: {
            userId: userId,
            paymentTransactionId: transaction.id,
            items: {
              createMany: {
                data: orderItems,
              },
            },
            menuId: menuId,
          },
          select: {
            id: true,
            menu: {
              select: {
                type: true,
                date: true,
              },
            },
            user: {
              select: {
                name: true,
              },
            },
          },
        })
        orders.push(order)
      }
    }

    await client.cartItem.deleteMany({
      where: { userId: userId },
    })

    return orders
  })
}

// Get orders count for user navigation badge, today's reservation and live orders
export async function getOrdersCount({ userId }: { userId: string }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return await prisma.order.count({
    where: {
      userId: userId,
      timeCanceled: null,
      timeCompleted: null,
      OR: [
        {
          menu: {
            type: 'LIVE',
          },
        },
        {
          menu: {
            date: {
              gte: today,
              lt: tomorrow,
            },
          },
        },
      ],
    },
  })
}

// Detect order is cancelable
function isOrderCancelable({
  order,
}: {
  order: Pick<Order, OrderStatus> & {
    menu: Pick<Menu, 'closedDate' | 'type' | 'date'>
  }
}) {
  if (
    order.timeCanceled ||
    order.timeCompleted ||
    order.timeDishedUp ||
    order.timePreparing
  ) {
    return false
  }

  if (
    order.menu.date &&
    order.menu.closedDate &&
    new Date() <= order.menu.closedDate
  )
    return true
  if (order.menu.type === 'LIVE') return true
  return false
}

// Get orders for user, including search function
export async function getOrders({
  cursor,
  userId,
  type,
  keyword,
}: {
  userId: string
  cursor?: number
} & (
  | { type: 'live' | 'reservation' | 'archived'; keyword?: never }
  | { type: 'search'; keyword: string }
)) {
  if (type === 'search' && !keyword) return []

  let whereInput: Prisma.OrderWhereInput
  switch (type) {
    case 'live':
      whereInput = {
        userId: userId,
        timeCanceled: null,
        timeCompleted: null,
        menu: {
          type: 'LIVE',
        },
      }
      break
    case 'reservation':
      whereInput = {
        userId: userId,
        timeCanceled: null,
        timeCompleted: null,
        menu: {
          type: { not: 'LIVE' },
        },
      }
      break
    case 'archived':
      whereInput = {
        userId: userId,
        OR: [{ timeCanceled: { not: null } }, { timeCompleted: { not: null } }],
      }
      break
    case 'search':
      // check if keyword is a order id
      if (keyword.match(/^\#\d+$/)) {
        whereInput = {
          userId: userId,
          id: parseInt(keyword.slice(1)),
        }
        break
      }

      // Check datetime format
      let keywordForDate = keyword
      if (keyword.match(/^\d{1,2}[\ \/\-]\d{1,2}$/)) {
        keywordForDate = `${new Date().getFullYear()} ${keyword}`
      }
      const searchDate = new Date(keywordForDate)
      if (
        !isNaN(searchDate.getTime()) &&
        searchDate.getFullYear() > 2020 &&
        searchDate.getFullYear() < 2100
      ) {
        const searchDateStart = new Date(searchDate.setHours(0, 0, 0, 0))
        const searchDateEnd = new Date(searchDate.setHours(23, 59, 59, 999))
        whereInput = {
          userId: userId,
          OR: [
            {
              menu: {
                date: searchDateStart,
              },
            },
            {
              createdAt: {
                gte: searchDateStart,
                lte: searchDateEnd,
              },
            },
            {
              timeCanceled: {
                gte: searchDateStart,
                lte: searchDateEnd,
              },
            },
            {
              timeCompleted: {
                gte: searchDateStart,
                lte: searchDateEnd,
              },
            },
          ],
        }
        break
      }

      // Check if keyword is a menu type
      if (keyword === '即時') {
        whereInput = {
          userId: userId,
          menu: {
            type: 'LIVE',
          },
        }
        break
      }
      if (keyword === '取消') {
        whereInput = {
          userId: userId,
          timeCanceled: { not: null },
        }
        break
      }
      if (['預約', '預訂'].includes(keyword)) {
        whereInput = {
          userId: userId,
          menu: {
            date: { not: null },
          },
        }
        break
      }
      if (Object.values(MenuTypeName).includes(keyword)) {
        const foundType = Object.entries(MenuTypeName).find(
          ([, value]) => value === keyword,
        )?.[0]
        if (foundType) {
          whereInput = {
            userId: userId,
            menu: {
              type: foundType as MenuType,
            },
          }
          break
        }
      }

      // Default text search
      whereInput = {
        userId: userId,
        OR: [
          { menu: { name: { contains: keyword } } },
          { items: { some: { name: { contains: keyword } } } },
        ],
      }
      break
  }

  const rawOrders = await prisma.order.findMany({
    where: whereInput,
    include: {
      menu: {
        select: {
          date: true,
          type: true,
          name: true,
          closedDate: true,
        },
      },
      items: {
        select: {
          id: true,
          name: true,
          price: true,
          quantity: true,
          options: true,
          image: {
            select: {
              id: true,
              path: true,
            },
          },
        },
      },
      paymentTransaction: {
        select: {
          pointAmount: true,
          creditAmount: true,
        },
      },
    },
    cursor: cursor ? { id: cursor } : undefined,
    take: settings.ORDER_TAKE_PER_QUERY + 1,
    orderBy: {
      createdAt: 'desc',
    },
  })

  const injectedCanCancelOrders = rawOrders.map((order) => {
    const canCancel = isOrderCancelable({ order })
    return {
      ...order,
      canCancel,
    }
  })

  return injectedCanCancelOrders as ConvertPrismaJson<
    typeof injectedCanCancelOrders
  >
}

// Get orders for POS
export async function getLiveOrdersForPOS({
  type,
}: {
  type: 'live' | 'archived'
}) {
  const todayDate = new Date(new Date().setHours(0, 0, 0, 0))

  let whereInput: Prisma.OrderWhereInput
  switch (type) {
    case 'live':
      whereInput = {
        menu: {
          type: 'LIVE',
        },
        timeCanceled: null,
        timeCompleted: null,
      }
      break
    case 'archived':
      whereInput = {
        menu: {
          type: 'LIVE',
        },
        OR: [
          { timeCanceled: { gte: todayDate } },
          { timeCompleted: { gte: todayDate } },
        ],
      }
      break
    default:
      throw new Error('Invalid type')
  }

  // Live orders and archived
  const rawPOSOrders = await prisma.order.findMany({
    where: whereInput,
    include: {
      items: {
        include: {
          image: {
            select: {
              id: true,
              path: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          profileImage: {
            select: {
              id: true,
              path: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: type === 'archived' ? 'desc' : 'asc',
    },
  })

  return rawPOSOrders as ConvertPrismaJson<typeof rawPOSOrders>
}

// Get orders for POS
export async function getReservationOrdersForPOS({
  type,
}: {
  type: 'today' | 'future'
}) {
  const todayDate = new Date(new Date().setHours(0, 0, 0, 0))

  const whereInput: Prisma.MenuWhereInput =
    type === 'today'
      ? {
          date: todayDate,
        }
      : {
          date: {
            gt: todayDate,
          },
        }

  const rawReservationMenus = await prisma.menu.findMany({
    where: {
      ...whereInput,
      orders: {
        some: {
          timeCanceled: null,
        },
      },
    },
    select: {
      type: true,
      date: true,
      name: true,
      commodities: {
        where: {
          orderItems: {
            some: {
              order: { timeCanceled: null },
            },
          },
        },
        select: {
          commodity: {
            select: {
              id: true,
              name: true,
            },
          },
          orderItems: {
            where: {
              order: { timeCanceled: null },
            },
            select: {
              quantity: true,
              options: true,
              order: {
                select: {
                  id: true,
                  createdAt: true,
                  timeDishedUp: true,
                  timePreparing: true,
                  timeCanceled: true,
                  timeCompleted: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      profileImage: {
                        select: {
                          path: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  })

  // Summarize orders and sync status
  const ordersSyncQueries: Prisma.OrderUpdateManyArgs[] = []
  const reservationMenus = rawReservationMenus.map((menu) => {
    const coms = menu.commodities.map((com) => {
      let totalQuantity = 0
      const orderIds: number[] = []
      const optionsWithOrdersMap: {
        [option: string]: {
          option: OrderOptions
          quantity: number
          orders: {
            user: typeof rawReservationMenus[0]['commodities'][0]['orderItems'][0]['order']['user']
            quantity: number
          }[]
        }
      } = {}
      const orderTimes: Record<
        OrderStatus,
        { value: Date | null; isNeedSync: boolean }
      > = {
        timeDishedUp: {
          value: com.orderItems[0]!.order.timeDishedUp,
          isNeedSync: false,
        },
        timePreparing: {
          value: com.orderItems[0]!.order.timePreparing,
          isNeedSync: false,
        },
        timeCanceled: {
          value: com.orderItems[0]!.order.timeCanceled,
          isNeedSync: false,
        },
        timeCompleted: {
          value: com.orderItems[0]!.order.timeCompleted,
          isNeedSync: false,
        },
      }

      // Per order item
      com.orderItems.forEach((item) => {
        // Sum quantity
        totalQuantity += item.quantity
        // Collect order ids
        if (orderIds.indexOf(item.order.id) === -1) {
          orderIds.push(item.order.id)
        }
        // Collect options
        const optionsKey = generateOptionsKey(item.options as OrderOptions)
        if (!(optionsKey in optionsWithOrdersMap)) {
          optionsWithOrdersMap[optionsKey] = {
            option: item.options as OrderOptions,
            quantity: 0,
            orders: [],
          }
        }
        optionsWithOrdersMap[optionsKey].quantity += item.quantity
        const userOrder = optionsWithOrdersMap[optionsKey].orders.find(
          (order) => order.user.id === item.order.user.id,
        )
        if (userOrder) {
          userOrder.quantity += item.quantity
        } else {
          optionsWithOrdersMap[optionsKey].orders.push({
            user: item.order.user,
            quantity: item.quantity,
          })
        }
        // Sync status
        ORDER_STATUS.forEach((statusName) => {
          const status = item.order[statusName]
          const referenceStatus = orderTimes[statusName]
          // Check if need sync
          if (
            (status && !referenceStatus.value) ||
            (!status && referenceStatus.value)
          ) {
            if (!referenceStatus.isNeedSync) {
              referenceStatus.isNeedSync = true
            }
          }
          // Update status to latest
          if (status) {
            if (!referenceStatus.value || status > referenceStatus.value!) {
              referenceStatus.value = item.order[statusName]
            }
          }
        })
      })

      // Push sync query when needed
      ORDER_STATUS.forEach((statusName) => {
        const referenceStatus = orderTimes[statusName]
        if (referenceStatus.isNeedSync) {
          ordersSyncQueries.push({
            where: {
              id: {
                in: orderIds,
              },
              [statusName]: null,
              ...{ timeCanceled: null },
            },
            data: {
              [statusName]: referenceStatus.value,
            },
          })
        }
      })

      return {
        id: com.commodity.id,
        name: com.commodity.name,
        orderIds: com.orderItems.map((item) => item.order.id),
        totalQuantity,
        orderTimes,
        optionsWithOrders: Object.keys(optionsWithOrdersMap)
          .sort()
          .map((key) => optionsWithOrdersMap[key]),
      }
    })

    // Sync orders status
    if (ordersSyncQueries.length > 0) {
      prisma.$transaction(
        ordersSyncQueries.map((query) => prisma.order.updateMany(query)),
      )
    }

    return {
      type: menu.type,
      date: menu.date,
      name: menu.name,
      coms,
    }
  })

  return reservationMenus
}

/* Update order, and process refund if canceled, if userId provided, valid userId owned */
export async function updateOrderStatus({
  orderId,
  status,
  userId,
}: {
  orderId: number
  status: Extract<keyof Order, OrderStatus>
  userId?: string
}) {
  const { order, callback } = await prisma.$transaction(async (client) => {
    const order = await client.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      throw new Error('Order not found')
    }

    if (order[status] !== null) {
      throw new Error('Order status already updated')
    }

    if (userId && order.userId !== userId) {
      throw new Error('User not authorized')
    }

    if (status === 'timeCanceled' && order.timeCompleted !== null) {
      throw new Error('Order already completed')
    }

    if (status === 'timeCompleted' && order.timeCanceled !== null) {
      throw new Error('Order already canceled')
    }

    const updatedOrder = await client.order.update({
      where: {
        id: orderId,
      },
      data: {
        [status]: new Date(),
      },
    })

    if (status !== 'timeCanceled') return { order: updatedOrder }

    // Refund user balance when canceled
    const detailedOrder = await client.order.findUnique({
      where: { id: orderId },
      select: {
        items: true,
        paymentTransaction: {
          select: {
            creditAmount: true,
            pointAmount: true,
            ordersForPayment: {
              select: {
                canceledTransaction: {
                  select: {
                    creditAmount: true,
                    pointAmount: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!detailedOrder) {
      throw new Error('Transaction not found for refund')
    }
    if (!detailedOrder.paymentTransaction) {
      throw new Error('Payment transaction not found for refund')
    }

    // Calculate refund amount
    let creditAmountRemain = detailedOrder.paymentTransaction.creditAmount
    let pointAmountRemain = detailedOrder.paymentTransaction.pointAmount

    for (const orderForPayment of detailedOrder.paymentTransaction
      .ordersForPayment) {
      if (orderForPayment.canceledTransaction) {
        creditAmountRemain -= orderForPayment.canceledTransaction.creditAmount
        pointAmountRemain -= orderForPayment.canceledTransaction.pointAmount
      }
    }

    const thisOrderPrice = detailedOrder.items.reduce((acc, item) => {
      return acc + item.price * item.quantity
    }, 0)
    const creditAmountToRefund = Math.min(creditAmountRemain, thisOrderPrice)
    const pointAnountToRefund = Math.min(
      pointAmountRemain,
      thisOrderPrice - creditAmountToRefund,
    )

    // Create refund transaction
    const { callback } = await rechargeUserBalanceBase({
      userId: order.userId,
      pointAmount: pointAnountToRefund,
      creditAmount: creditAmountToRefund,
      orderId,
      client,
    })

    return { order: updatedOrder, callback }
  })

  callback?.()
  return order
}

export async function updateOrdersStatus({
  orderIds,
  status,
}: {
  orderIds: number[]
  status: OrderStatus
}) {
  let orders: Order[] = []
  for (const orderId of orderIds) {
    try {
      const order = await updateOrderStatus({ orderId, status })
      orders.push(order)
    } catch (error) {
      logError(error)
      continue
    }
  }
  return orders
}
