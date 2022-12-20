import { Prisma, Order } from '@prisma/client'

import { getCartItemsBase } from './cart'
import { chargeUserBalanceBase } from './transaction'

export async function createOrder({ userId }: { userId: string }) {
  await prisma?.$transaction(async (client) => {
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
    let orders: Order[] = []
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
      })
      orders.push(order)
    }

    await client.cartItem.deleteMany({
      where: { userId: userId },
    })

    return orders
  })
}
