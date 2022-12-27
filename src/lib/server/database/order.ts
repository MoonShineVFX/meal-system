import { Prisma, Order, MenuType } from '@prisma/client'

import { ConvertPrismaJson, settings } from '@/lib/common'
import { getCartItemsBase } from './cart'
import { chargeUserBalanceBase, rechargeUserBalanceBase } from './transaction'
import { prisma } from './define'

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
          type: 'MAIN',
        },
      }
      break
    case 'reservation':
      whereInput = {
        userId: userId,
        timeCanceled: null,
        timeCompleted: null,
        menu: {
          type: { not: 'MAIN' },
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
      // Check datetime or text
      const searchDate = new Date(keyword)
      if (!isNaN(searchDate.getTime())) {
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

      // check if keyword is a order id
      if (keyword.match(/^\#\d+$/)) {
        whereInput = {
          userId: userId,
          id: parseInt(keyword.slice(1)),
        }
        break
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

  return rawOrders as ConvertPrismaJson<typeof rawOrders>
}

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
          type: 'MAIN',
        },
        timeCanceled: null,
        timeCompleted: null,
      }
      break
    case 'reservation':
      whereInput = {
        menu: {
          type: { not: 'MAIN' },
          date: todayDate, // limit to today reservations
        },
      }
      break
    case 'archived':
      whereInput = {
        menu: {
          type: 'MAIN',
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

export async function updateOrderStatus({
  orderId,
  status,
}: {
  orderId: number
  status: Extract<
    keyof Order,
    'timePreparing' | 'timeCanceled' | 'timeDishedUp' | 'timeCompleted'
  >
}) {
  return await prisma.$transaction(async (client) => {
    const order = await client.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      throw new Error('Order not found')
    }

    if (order[status] !== null) {
      throw new Error('Order status already updated')
    }

    const updatedOrder = await client.order.update({
      where: {
        id: orderId,
      },
      data: {
        [status]: new Date(),
      },
    })

    if (status !== 'timeCanceled') return updatedOrder

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
    await rechargeUserBalanceBase({
      userId: order.userId,
      pointAmount: pointAnountToRefund,
      creditAmount: creditAmountToRefund,
      orderId,
      client,
    })

    return updatedOrder
  })
}
