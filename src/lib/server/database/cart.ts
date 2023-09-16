import { Prisma, PrismaClient } from '@prisma/client'

import { getMenuWithComs } from './menu'
import {
  OrderOptions,
  generateOptionsKey,
  ConvertPrismaJson,
} from '@/lib/common'
import { prisma } from './define'
import { validateAndSortOrderOptions } from '@/lib/common'

/** Check CartItem is creatable */
export async function validateCartItemCreatable({
  userId,
  menuId,
  commodityId,
  quantity,
  options,
  client,
}: CreateCartItemArgs & {
  client?: Prisma.TransactionClient | PrismaClient
}) {
  const thisPrisma = client ?? prisma

  // Validate availability
  const menu = await getMenuWithComs({
    menuId,
    userId,
    limitCommodityIds: [commodityId],
    client: thisPrisma,
  })

  const com = menu.commodities.find((com) => com.commodity.id === commodityId)
  if (!com) {
    throw new Error('找不到指定餐點')
  }

  if (menu.unavailableReasons.length > 0) {
    throw new Error(`菜單目前沒有開放: ${menu.unavailableReasons.join(', ')}`)
  }
  if (com.unavailableReasons.length > 0) {
    throw new Error(`餐點無法訂購: ${com.unavailableReasons.join(', ')}`)
  }
  if (quantity > Math.min(com.maxQuantity, menu.maxQuantity)) {
    throw new Error(`超出最大訂購量: ${com.maxQuantity}`)
  }

  // Validate options
  const comOptionSets = com.commodity.optionSets
  return validateAndSortOrderOptions({
    options,
    truthOptionSets: comOptionSets,
  })
}

/* Create CartItem */
type CreateCartItemArgs = {
  userId: string
  menuId: number
  commodityId: number
  quantity: number
  options: OrderOptions
}
export async function createCartItem(args: CreateCartItemArgs) {
  const { userId, menuId, commodityId, quantity, options } = args
  const optionsKey = generateOptionsKey(options)

  return await prisma.$transaction(async (client) => {
    const sortedOptions = await validateCartItemCreatable({ ...args, client })

    return await client.cartItem.upsert({
      where: {
        userId_menuId_commodityId_optionsKey: {
          userId,
          menuId,
          commodityId,
          optionsKey,
        },
      },
      update: {
        invalid: false,
        quantity: {
          increment: quantity,
        },
      },
      create: {
        userId,
        menuId,
        commodityId,
        optionsKey,
        options: sortedOptions,
        quantity,
      },
      select: {
        commodityOnMenu: {
          select: {
            commodity: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })
  })
}

/* Update CartItem */
export async function updateCartItem(
  args: CreateCartItemArgs & { previousOptionsKey: string },
) {
  const { userId, menuId, commodityId, quantity, options, previousOptionsKey } =
    args

  // Generate optionsKey
  const currentOptionsKey = generateOptionsKey(options)

  return await prisma.$transaction(async (client) => {
    // Delete previous cart item
    await client.cartItem.delete({
      where: {
        userId_menuId_commodityId_optionsKey: {
          userId,
          commodityId,
          menuId,
          optionsKey: previousOptionsKey,
        },
      },
    })

    const sortedOptions = await validateCartItemCreatable({ ...args, client })

    // Check cart item exists and valid, for quantity increment or replacement
    const cartItem = await client.cartItem.findUnique({
      where: {
        userId_menuId_commodityId_optionsKey: {
          userId,
          menuId,
          commodityId,
          optionsKey: currentOptionsKey,
        },
      },
      select: {
        invalid: true,
      },
    })
    const hasBeenInvalid = cartItem?.invalid ?? false

    // Upsert cart item
    return await client.cartItem.upsert({
      where: {
        userId_menuId_commodityId_optionsKey: {
          userId,
          menuId,
          commodityId,
          optionsKey: currentOptionsKey,
        },
      },
      update: {
        quantity: hasBeenInvalid
          ? quantity
          : {
              increment: quantity,
            },
        invalid: false,
      },
      create: {
        userId,
        menuId,
        commodityId,
        optionsKey: currentOptionsKey,
        quantity,
        options: sortedOptions,
      },
      select: {
        commodityOnMenu: {
          select: {
            commodity: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })
  })
}

/** Validate user cart items and return */
export async function getCartItemsBase({
  userId,
  client,
}: {
  userId: string
  client?: Prisma.TransactionClient | PrismaClient
}) {
  const thisPrisma = client ?? prisma
  const rawCartItems = await thisPrisma.cartItem.findMany({
    where: {
      userId,
    },
    select: {
      userId: true,
      optionsKey: true,
      quantity: true,
      options: true,
      invalid: true,
      commodityId: true,
      menuId: true,
      commodityOnMenu: {
        select: {
          menu: {
            select: {
              name: true,
              date: true,
              type: true,
            },
          },
          commodity: {
            select: {
              name: true,
              price: true,
              imageId: true,
              image: {
                select: {
                  path: true,
                },
              },
              optionSets: true,
            },
          },
        },
      },
    },
    orderBy: {
      optionsKey: 'asc',
    },
  })
  const cartItems = rawCartItems as ConvertPrismaJson<typeof rawCartItems>

  const invalidCartItems: typeof cartItems = []
  const validCartItems: typeof cartItems = []
  const decrementCartItems: (typeof cartItems[0] & {
    decrementAmount: number
  })[] = []

  const menuAndCommoditiesMetas: {
    [menuId: number]: {
      cartQuantity: number
      coms: {
        commodityId: number
        cartQuantity: number
        cartItems: typeof cartItems
      }[]
    }
  } = {}

  for (const cartItem of cartItems) {
    if (cartItem.invalid) {
      invalidCartItems.push(cartItem)
      continue
    }

    // validate options
    const comOptionSets = cartItem.commodityOnMenu.commodity.optionSets
    try {
      validateAndSortOrderOptions({
        options: cartItem.options,
        truthOptionSets: comOptionSets,
      })
    } catch (e) {
      invalidCartItems.push(cartItem)
      continue
    }

    // group by menu and sum cartItem quantities
    const { menuId, commodityId } = cartItem
    if (!menuAndCommoditiesMetas[menuId]) {
      menuAndCommoditiesMetas[menuId] = {
        coms: [],
        cartQuantity: cartItem.quantity,
      }
    } else {
      menuAndCommoditiesMetas[menuId].cartQuantity += cartItem.quantity
    }

    const comMetaIndex = menuAndCommoditiesMetas[menuId].coms.findIndex(
      (comMeta) => comMeta.commodityId === commodityId,
    )
    if (comMetaIndex === -1) {
      menuAndCommoditiesMetas[menuId].coms.push({
        commodityId: commodityId,
        cartQuantity: cartItem.quantity,
        cartItems: [cartItem],
      })
    } else {
      menuAndCommoditiesMetas[menuId].coms[comMetaIndex].cartQuantity +=
        cartItem.quantity
      menuAndCommoditiesMetas[menuId].coms[comMetaIndex].cartItems.push(
        cartItem,
      )
    }
  }

  let menuMap: Map<
    number,
    Awaited<ReturnType<typeof getMenuWithComs>>
  > = new Map()
  for (const [menuIdKey, menuMeta] of Object.entries(menuAndCommoditiesMetas)) {
    // validate menu
    const menuId = Number(menuIdKey)
    const commodityIds = menuMeta.coms.map((com) => com.commodityId)

    let menu: Awaited<ReturnType<typeof getMenuWithComs>>
    try {
      menu = await getMenuWithComs({
        menuId,
        userId,
        limitCommodityIds: commodityIds,
        client: thisPrisma,
        excludeCartItems: true,
      })
      // validate menu availability
      if (menu.unavailableReasons.length > 0) {
        throw new Error(`菜單驗證失敗: ${menu.unavailableReasons.join(', ')}`)
      }
    } catch (e) {
      invalidCartItems.push(...menuMeta.coms.flatMap((com) => com.cartItems))
      continue
    }

    menuMap.set(menuId, menu)

    // validate menu quantities
    if (menuMeta.cartQuantity > menu.maxQuantity) {
      for (const cartItem of menuMeta.coms.flatMap((com) => com.cartItems)) {
        if (menu.maxQuantity <= 0) {
          invalidCartItems.push(cartItem)
          continue
        }
        if (cartItem.quantity > menu.maxQuantity) {
          decrementCartItems.push({
            ...cartItem,
            decrementAmount: cartItem.quantity - menu.maxQuantity,
          })
          menu.maxQuantity = 0
        } else {
          menu.maxQuantity -= cartItem.quantity
          validCartItems.push(cartItem)
        }
      }
      continue
    } else {
      // validate commodity
      for (const comMeta of menuMeta.coms) {
        const com = menu.commodities.find(
          (com) => com.commodity.id === comMeta.commodityId,
        )

        // validate commodity availability
        if (!com || com.unavailableReasons.length > 0) {
          invalidCartItems.push(...comMeta.cartItems)
          continue
        }
        // validate commodity quantities
        for (const cartItem of comMeta.cartItems) {
          if (com.maxQuantity <= 0) {
            invalidCartItems.push(cartItem)
            continue
          }
          if (cartItem.quantity > com.maxQuantity) {
            decrementCartItems.push({
              ...cartItem,
              decrementAmount: cartItem.quantity - com.maxQuantity,
            })
            com.maxQuantity = 0
          } else {
            com.maxQuantity -= cartItem.quantity
            validCartItems.push(cartItem)
          }
        }
      }
    }
  }

  let isModified = false

  // update invalid cart items
  for (const cartItem of invalidCartItems) {
    if (cartItem.invalid) {
      continue
    }

    await thisPrisma.cartItem.update({
      where: {
        userId_menuId_commodityId_optionsKey: {
          userId: cartItem.userId,
          menuId: cartItem.menuId,
          commodityId: cartItem.commodityId,
          optionsKey: cartItem.optionsKey,
        },
      },
      data: { invalid: true },
    })
    cartItem.invalid = true

    if (!isModified) isModified = true
  }

  // update decrement cart items
  for (const cartItem of decrementCartItems) {
    await thisPrisma.cartItem.update({
      where: {
        userId_menuId_commodityId_optionsKey: {
          userId: cartItem.userId,
          menuId: cartItem.menuId,
          commodityId: cartItem.commodityId,
          optionsKey: cartItem.optionsKey,
        },
      },
      data: { quantity: { decrement: cartItem.decrementAmount } },
    })
    cartItem.quantity -= cartItem.decrementAmount
    validCartItems.push(cartItem)

    if (!isModified) isModified = true
  }

  const injectedInvalidCartIems = invalidCartItems.map((cartItem) => ({
    menuId: cartItem.menuId,
    commodityId: cartItem.commodityId,
    optionsKey: cartItem.optionsKey,
    quantity: cartItem.quantity,
    options: cartItem.options,
    invalid: cartItem.invalid,
    commodityOnMenu: {
      commodity: cartItem.commodityOnMenu.commodity,
      menu: cartItem.commodityOnMenu.menu,
    },
  }))

  const injectedValidCartItems = validCartItems.map((cartItem) => {
    const thisMenu = menuMap.get(cartItem.menuId)
    if (!thisMenu) throw new Error('整合時發生錯誤，菜單不存在')
    const thisCOM = thisMenu.commodities.find(
      (com) => com.commodity.id === cartItem.commodityId,
    )
    if (!thisCOM) throw new Error('整合時發生錯誤，餐點不存在')

    return {
      menuId: cartItem.menuId,
      commodityId: cartItem.commodityId,
      optionsKey: cartItem.optionsKey,
      quantity: cartItem.quantity,
      options: cartItem.options,
      invalid: cartItem.invalid,
      commodityOnMenu: {
        maxQuantity: thisCOM.maxQuantity,
        menu: {
          name: thisMenu.name,
          date: thisMenu.date,
          type: thisMenu.type,
          maxQuantity: thisMenu.maxQuantity,
          limitPerUser: thisMenu.limitPerUser,
        },
        commodity: {
          name: thisCOM.commodity.name,
          price: thisCOM.commodity.price,
          image: thisCOM.commodity.image,
          imageId: cartItem.commodityOnMenu.commodity.imageId,
          optionSets: thisCOM.commodity.optionSets,
        },
      },
    }
  })

  return {
    invalidCartItems: injectedInvalidCartIems,
    cartItems: injectedValidCartItems,
    isModified,
  }
}
export async function getCartItems(userId: string) {
  return await prisma.$transaction(async (client) => {
    return await getCartItemsBase({ userId, client })
  })
}

/* Delete Cart Items */
type CartItemFromIds = {
  ids: Omit<
    NonNullable<
      Prisma.CartItemDeleteArgs['where']['userId_menuId_commodityId_optionsKey']
    >,
    'userId'
  >[]
  invalidOnly?: never
}
type CartItemFromAll = {
  ids?: never
  invalidOnly?: boolean
}
type DeleteCartItemsArgs = {
  userId: string
} & (CartItemFromIds | CartItemFromAll)

export async function deleteCartItems({
  userId,
  ids,
  invalidOnly,
}: DeleteCartItemsArgs) {
  if (invalidOnly && ids) {
    throw new Error('invalidOnly 和 ids 不能同時存在')
  }

  if (ids) {
    for (const id of ids) {
      await prisma.cartItem.delete({
        where: { userId_menuId_commodityId_optionsKey: { userId, ...id } },
      })
    }
  } else {
    await prisma.cartItem.deleteMany({
      where: { userId: userId, invalid: invalidOnly },
    })
  }
}
