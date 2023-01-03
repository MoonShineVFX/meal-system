import { Prisma, Order, MenuType, Menu } from '@prisma/client'

import { ConvertPrismaJson, settings, MenuTypeName } from '@/lib/common'
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

    // create order items and group by menu
    const orderItemCreates = getCartItemsResult.cartItems.reduce(
      (acc: Map<number, Prisma.OrderItemCreateManyOrderInput[]>, cartItem) => {
        if (!acc.has(cartItem.menuId)) {
          acc.set(cartItem.menuId, [])
        }
        acc.get(cartItem.menuId)?.push({
          name: cartItem.commodityOnMenu.commodity.name,
          price: cartItem.commodityOnMenu.commodity.price,
          quantity: cartItem.quantity,
          options: cartItem.options,
          menuId: cartItem.menuId,
          commodityId: cartItem.commodityId,
          imageId: cartItem.commodityOnMenu.commodity.imageId,
        })
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
        type: MenuType
      }
    }[] = []
    for (const [menuId, orderItems] of orderItemCreates) {
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
  order: Pick<
    Order,
    'timeCanceled' | 'timeCompleted' | 'timeDishedUp' | 'timePreparing'
  > & { menu: Pick<Menu, 'closedDate' | 'type' | 'date'> }
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
export async function getOrdersForPOS({
  type,
}: {
  type: 'live' | 'reservation' | 'archived'
}) {
  let whereInput: Prisma.OrderWhereInput
  const todayDate = new Date(new Date().setHours(0, 0, 0, 0))
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
    case 'reservation':
      whereInput = {
        menu: {
          date: todayDate, // limit to today reservations
        },
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
  }

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

/* Update order, and process refund if canceled, if userId provided, valid userId owned */
export async function updateOrderStatus({
  orderId,
  status,
  userId,
}: {
  orderId: number
  status: Extract<
    keyof Order,
    'timePreparing' | 'timeCanceled' | 'timeDishedUp' | 'timeCompleted'
  >
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
