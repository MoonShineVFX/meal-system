import { NotificationType, useStore } from '@/lib/client/store'
import trpc from './trpc'

/* Cart */
export function useAddCartMutation() {
  const utils = trpc.useUtils()
  const addNotification = useStore((state) => state.addNotification)

  return trpc.cart.add.useMutation({
    onSuccess: (cartItem) => {
      utils.cart.get.invalidate()
      utils.menu.get.invalidate()
      addNotification({
        type: NotificationType.SUCCESS,
        message: `新增 ${cartItem.commodityOnMenu.commodity.name} 至購物車`,
        link: '/cart',
      })
    },
  })
}

export function useUpdateCartMutation() {
  const utils = trpc.useUtils()

  return trpc.cart.update.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate()
      utils.menu.get.invalidate()
    },
  })
}

export function useDeleteCartMutation() {
  const utils = trpc.useUtils()

  const deleteCartMutation = trpc.cart.delete.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate()
      utils.menu.get.invalidate()

      deleteCartMutation.reset()
    },
  })

  return deleteCartMutation
}

/* Order */
export function useCreateOrderFromCartMutation() {
  const utils = trpc.useUtils()
  const addNotification = useStore((state) => state.addNotification)

  return trpc.order.addFromCart.useMutation({
    onSuccess: (orders) => {
      utils.menu.get.invalidate()
      utils.cart.get.invalidate()
      utils.user.get.invalidate()
      utils.order.get.invalidate()
      utils.order.getBadgeCount.invalidate()
      utils.transaction.getListByUser.invalidate()

      addNotification({
        type: NotificationType.SUCCESS,
        message: `結帳完成`,
        link: `/order/id/${orders[0].id}`,
      })
    },
  })
}

export function useCreateOrderFromRetailMutation() {
  const utils = trpc.useUtils()
  const addNotification = useStore((state) => state.addNotification)

  return trpc.order.addFromRetail.useMutation({
    onSuccess: (order) => {
      utils.menu.get.invalidate()
      utils.cart.get.invalidate()
      utils.user.get.invalidate()
      utils.order.get.invalidate()
      utils.order.getBadgeCount.invalidate()
      utils.transaction.getListByUser.invalidate()

      addNotification({
        type: NotificationType.SUCCESS,
        message: `結帳完成`,
        link: `/order/id/${order.id}`,
      })
    },
  })
}
