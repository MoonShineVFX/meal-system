import { Prisma, Order, MenuType } from '@prisma/client'

import { ConvertPrismaJson } from '@/lib/common'
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

export async function getOrders({ userId }: { userId: string }) {
  const rawOrders = await prisma.order.findMany({
    where: { userId: userId },
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
    orderBy: {
      createdAt: 'desc',
    },
  })

  return rawOrders as ConvertPrismaJson<typeof rawOrders>
}

export async function getOrdersForPOS({
  checkArchived: checkHistory,
}: {
  checkArchived?: boolean
}) {
  const whereInput: Prisma.OrderWhereInput = checkHistory
    ? {
        menu: {
          type: 'MAIN',
        },
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)), // limit to today archives
        },
        OR: [{ timeCanceled: { not: null } }, { timeCompleted: { not: null } }],
      }
    : {
        menu: {
          type: 'MAIN',
        },
        timeCanceled: null,
        timeCompleted: null,
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
      createdAt: checkHistory ? 'desc' : 'asc',
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
