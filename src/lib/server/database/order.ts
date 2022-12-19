import { OrderOptions } from '@/lib/common'
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

    // create order items
    const orderItemCreates = getCartItemsResult.cartItems.map((cartItem) => ({
      name: cartItem.commodityOnMenu.commodity.name,
      price: cartItem.commodityOnMenu.commodity.price,
      quantity: cartItem.quantity,
      options: cartItem.options as OrderOptions,
      menuId: cartItem.menuId,
      commodityId: cartItem.commodityId,
      imageId: cartItem.commodityOnMenu.commodity.imageId,
    }))

    // Create order
    const order = await client.order.create({
      data: {
        userId: userId,
        transactions: {
          connect: { id: transaction.id },
        },
        items: {
          createMany: {
            data: orderItemCreates,
          },
        },
      },
    })

    await client.cartItem.deleteMany({
      where: { userId: userId },
    })

    return order
  })
}
