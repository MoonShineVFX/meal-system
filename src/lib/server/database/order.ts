import { OrderOptions } from '@/lib/common'
import { getCartItems } from './cart'
import { chargeUserBalance } from './transaction'

export async function createOrder({ userId }: { userId: string }) {
  // Get valid cart items
  const getCartItemsResult = await getCartItems(userId)
  const totalPrice = getCartItemsResult.cartItems.reduce(
    (acc, cur) => acc + cur.commodityOnMenu.commodity.price * cur.quantity,
    0,
  )

  // Create order and charge user
  const orderItemCreates = getCartItemsResult.cartItems.map((cartItem) => ({
    name: cartItem.commodityOnMenu.commodity.name,
    price: cartItem.commodityOnMenu.commodity.price,
    quantity: cartItem.quantity,
    options: cartItem.options as OrderOptions,
    menuId: cartItem.menuId,
    commodityId: cartItem.commodityId,
    imageId: cartItem.commodityOnMenu.commodity.imageId,
  }))

  return await chargeUserBalance(userId, totalPrice, orderItemCreates)
}
