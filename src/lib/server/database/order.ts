import { Prisma, Order, MenuType } from '@prisma/client'

import { ConvertPrismaJson } from '@/lib/common'
import { getCartItemsBase } from './cart'
import { chargeUserBalanceBase } from './transaction'
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
          transactions: {
            connect: { id: transaction.id },
          },
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
      transactions: {
        select: {
          createdAt: true,
          type: true,
          pointAmount: true,
          creditAmount: true,
          ethHashes: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return rawOrders as ConvertPrismaJson<typeof rawOrders>
}

export async function getOrdersForPOS() {
  const rawPOSOrders = await prisma.order.findMany({
    where: {
      menu: {
        type: 'MAIN',
      },
      timeCanceled: null,
      timeClosed: null,
    },
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
      createdAt: 'asc',
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
    'timePreparing' | 'timeCanceled' | 'timeClosed' | 'timeCompleted'
  >
}) {
  return await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      [status]: new Date(),
    },
  })
}
