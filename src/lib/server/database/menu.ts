import { MenuType, OrderStatus, Prisma } from '@prisma/client'

import type { OptionSet, OrderOptions } from '@/lib/common'
import { MenuUnavailableReason, ComUnavailableReason } from '@/lib/common'
import { prisma, log } from './define'

export async function createMenu(
  type: MenuType,
  name?: string,
  description?: string,
  date?: Date,
  publishedDate?: Date,
  closedDate?: Date,
  limitPerUser?: number,
) {
  // Validate date and type
  if (!date && type !== MenuType.MAIN) {
    throw new Error('date is required for non-main menu')
  }

  // Check menu existence
  let isFound = false
  try {
    await getMenu(type, date, undefined, undefined)
    isFound = true
  } catch (error) {}
  if (isFound) {
    throw new Error('menu already exists')
  }

  return await prisma.menu.create({
    data: {
      date,
      type,
      name,
      description,
      publishedDate,
      closedDate,
      limitPerUser,
    },
  })
}

/** If userId is provided, userOrderAvailability will be returned */
export async function getMenu(
  type?: MenuType,
  date?: Date,
  menuId?: number,
  userId?: string,
  commodityIds?: number[],
  excludeCartItems?: boolean,
  transactionClient?: Prisma.TransactionClient,
) {
  if (!type && !menuId) {
    throw new Error('type or menuId is required')
  }

  const isGetById = !!menuId
  const thisPrisma = transactionClient ?? prisma

  // Validate date and type
  if (!isGetById && !date && type !== MenuType.MAIN) {
    throw new Error('date is required for non-main menu')
  }

  // Get menu
  const menu = await thisPrisma.menu.findFirst({
    where: {
      type: !isGetById ? type : undefined,
      date,
      id: isGetById ? menuId : undefined,
      isDeleted: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      date: true,
      name: true,
      description: true,
      limitPerUser: true,
      publishedDate: true,
      closedDate: true,
      commodities: userId
        ? {
            where: {
              commodityId: commodityIds ? { in: commodityIds } : undefined,
              isDeleted: false,
              commodity: {
                isDeleted: false,
              },
            },
            select: {
              limitPerUser: true,
              stock: true,
              commodity: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  optionSets: true,
                  image: {
                    select: {
                      path: true,
                    },
                  },
                  categories: {
                    select: {
                      mainName: true,
                      subName: true,
                    },
                  },
                },
              },
              cartItems: excludeCartItems
                ? undefined
                : {
                    where: {
                      userId,
                      invalid: false,
                    },
                    select: {
                      quantity: true,
                    },
                  },
              orderItems: {
                where: {
                  order: {
                    status: {
                      not: OrderStatus.CANCELED,
                    },
                  },
                },
                select: {
                  order: {
                    select: {
                      userId: true,
                    },
                  },
                  quantity: true,
                },
              },
            },
          }
        : undefined,
    },
  })

  if (!menu) {
    throw new Error('menu not found')
  }

  // Validate menu and coms status
  let menuOrderedCount = {
    total: 0,
    user: 0,
  }

  // coms
  const validatedComs = menu.commodities?.map((com) => {
    const orderedCount = com.orderItems.reduce(
      (acc, cur) => {
        if (cur.order.userId === userId) {
          menuOrderedCount.user += cur.quantity
          acc.user += cur.quantity
        }
        menuOrderedCount.total += cur.quantity
        acc.total += cur.quantity
        return acc
      },
      {
        total: 0,
        user: 0,
      },
    )

    if (!excludeCartItems) {
      for (const cartItem of com.cartItems) {
        menuOrderedCount.user += cartItem.quantity
        orderedCount.user += cartItem.quantity
      }
    }

    // validate com
    const comUnavailableReasons: ComUnavailableReason[] = []
    if (com.stock !== 0 && orderedCount.total >= com.stock) {
      comUnavailableReasons.push(ComUnavailableReason.STOCK_OUT)
    }
    if (com.limitPerUser !== 0 && orderedCount.user >= com.limitPerUser) {
      comUnavailableReasons.push(
        ComUnavailableReason.COM_LIMIT_PER_USER_EXCEEDED,
      )
    }

    // calculate max quantity
    const maxQuantity = Math.min(
      com.stock !== 0 ? com.stock - orderedCount.total : 99,
      com.limitPerUser !== 0 ? com.limitPerUser - orderedCount.user : 99,
      menu.limitPerUser !== 0 ? menu.limitPerUser - orderedCount.total : 99,
    )

    const { orderItems, cartItems, ...rest } = com

    return {
      ...rest,
      maxQuantity,
      unavailableReasons: comUnavailableReasons,
    }
  })

  // validate menu
  const menuUnavailableReasons: MenuUnavailableReason[] = []
  const now = new Date()
  if (menu.publishedDate && menu.publishedDate > now) {
    menuUnavailableReasons.push(MenuUnavailableReason.NOT_PUBLISHED)
  }
  if (menu.closedDate && menu.closedDate < now) {
    menuUnavailableReasons.push(MenuUnavailableReason.CLOSED)
  }
  if (menu.limitPerUser !== 0 && menuOrderedCount.total >= menu.limitPerUser) {
    menuUnavailableReasons.push(
      MenuUnavailableReason.MENU_LIMIT_PER_USER_EXCEEDED,
    )
  }
  const maxQuantity = Math.min(
    menu.limitPerUser !== 0 ? menu.limitPerUser - menuOrderedCount.total : 99,
  )

  return {
    ...menu,
    commodities: validatedComs,
    unavailableReasons: menuUnavailableReasons,
    maxQuantity,
  }
}

export async function deleteMenu(menuId: number) {
  return await prisma.$transaction(async (client) => {
    // Check menu has been ordered
    const orderCount = await client.orderItem.count({
      where: {
        commodityOnMenu: {
          menuId: menuId,
        },
      },
    })

    if (orderCount > 0) {
      log('menu has been ordered, cannot be deleted, acrhived instead')
      // invalidate cart items
      await client.cartItem.updateMany({
        where: {
          menuId: menuId,
        },
        data: {
          invalid: true,
        },
      })

      return await client.menu.update({
        where: {
          id: menuId,
        },
        data: {
          isDeleted: true,
        },
        select: {
          isDeleted: true,
        },
      })
    } else {
      await client.menu.delete({
        where: {
          id: menuId,
        },
      })
    }
  })
}

export async function createCommodity(
  name: string,
  price: number,
  description?: string,
  optionSets?: OptionSet[],
  categoryIds?: number[],
  imageId?: string,
) {
  const commodity = await prisma.commodity.create({
    data: {
      name,
      description,
      price,
      optionSets: optionSets ?? [],
      imageId,
      categories: {
        connect: categoryIds?.map((id) => ({ id })) ?? [],
      },
    },
  })

  return commodity
}

export async function addCommodityToMenu(
  commodityId: number,
  menuId: number,
  overridePrice?: number,
  limitPerUser?: number,
  SKU?: number,
) {
  const updateData = {
    overridePrice,
    limitPerUser,
    SKU,
  }
  return await prisma.commodityOnMenu.upsert({
    where: {
      menuId_commodityId: {
        menuId,
        commodityId,
      },
    },
    update: {
      ...updateData,
      isDeleted: false,
    },
    create: {
      menuId,
      commodityId,
      ...updateData,
    },
  })
}

export async function createCategory(mainName: string, subName: string) {
  return await prisma.commodityCategory.upsert({
    where: {
      mainName_subName: {
        mainName,
        subName,
      },
    },
    update: {},
    create: {
      mainName,
      subName,
    },
  })
}

export async function createCartItem(
  userId: string,
  menuId: number,
  commodityId: number,
  quantity: number,
  options: OrderOptions,
) {
  // Generate optionsKey
  const optionsKey = Object.entries(options)
    .sort()
    .reduce((acc, cur) => {
      const prefix = acc === '' ? '' : '_'
      const value = Array.isArray(cur[1]) ? cur[1].sort().join(',') : cur[1]
      return `${acc}${prefix}${cur[0]}:${value}`
    }, '')

  return await prisma.$transaction(async (client) => {
    // Validate availability
    const menu = await getMenu(
      undefined,
      undefined,
      menuId,
      userId,
      [commodityId],
      false,
      client,
    )
    if (!menu) {
      throw new Error('找不到指定菜單')
    }

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
    if (quantity > com.maxQuantity) {
      throw new Error(`quantity exceeds max quantity: ${com.maxQuantity}`)
    }

    // Validate options
    const comOptionSets = com.commodity.optionSets as OptionSet[]
    validateCartOptions(options, comOptionSets)

    // Create cart item
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
        quantity: {
          increment: quantity,
        },
      },
      create: {
        userId,
        menuId,
        commodityId,
        optionsKey,
        options,
        quantity,
      },
    })
  })
}

/** Validate user cart items and return */
export async function getCartItems(userId: string) {
  return await prisma.$transaction(async (client) => {
    const cartItems = await client.cartItem.findMany({
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
            commodity: {
              select: {
                optionSets: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const invalidCartItems: typeof cartItems = []
    const validCartItems: typeof cartItems = []
    const decrementCartItems: (typeof cartItems[0] & {
      decrementAmount: number
    })[] = []

    const menuWithComnmodityIds: {
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
      const comOptionSets = cartItem.commodityOnMenu.commodity
        .optionSets as OptionSet[]
      try {
        validateCartOptions(cartItem.options as OrderOptions, comOptionSets)
      } catch (e) {
        invalidCartItems.push(cartItem)
        continue
      }

      // group by menu and sum cartItem quantities
      const { menuId, commodityId } = cartItem
      if (!menuWithComnmodityIds[menuId]) {
        menuWithComnmodityIds[menuId] = {
          coms: [],
          cartQuantity: cartItem.quantity,
        }
      } else {
        menuWithComnmodityIds[menuId].cartQuantity += cartItem.quantity
      }

      if (!menuWithComnmodityIds[menuId].coms[commodityId]) {
        menuWithComnmodityIds[menuId].coms[commodityId] = {
          commodityId: commodityId,
          cartQuantity: cartItem.quantity,
          cartItems: [cartItem],
        }
      } else {
        menuWithComnmodityIds[menuId].coms[commodityId].cartQuantity +=
          cartItem.quantity
        menuWithComnmodityIds[menuId].coms[commodityId].cartItems.push(cartItem)
      }
    }

    for (const [menuIdKey, menuMeta] of Object.entries(menuWithComnmodityIds)) {
      // validate menu
      const menuId = Number(menuIdKey)
      const commodityIds = menuMeta.coms.map((com) => com.commodityId)

      let menu: Awaited<ReturnType<typeof getMenu>>

      try {
        menu = await getMenu(
          undefined,
          undefined,
          menuId,
          userId,
          commodityIds,
          true,
          client,
        )
        // validate menu availability
        if (menu.unavailableReasons.length > 0) {
          throw new Error(`菜單驗證失敗: ${menu.unavailableReasons.join(', ')}`)
        }
      } catch (e) {
        invalidCartItems.push(...menuMeta.coms.flatMap((com) => com.cartItems))
        continue
      }

      // validate menu quantities
      if (menuMeta.cartQuantity > menu.maxQuantity) {
        let remainQuantity = menu.maxQuantity
        for (const cartItem of menuMeta.coms.flatMap((com) => com.cartItems)) {
          if (remainQuantity <= 0) {
            invalidCartItems.push(cartItem)
            continue
          }
          if (cartItem.quantity > remainQuantity) {
            decrementCartItems.push({
              ...cartItem,
              decrementAmount: cartItem.quantity - remainQuantity,
            })
            remainQuantity = 0
          } else {
            remainQuantity -= cartItem.quantity
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
          if (comMeta.cartQuantity > com.maxQuantity) {
            let remainQuantity = com.maxQuantity
            for (const cartItem of comMeta.cartItems) {
              if (remainQuantity <= 0) {
                invalidCartItems.push(cartItem)
                continue
              }
              if (cartItem.quantity > remainQuantity) {
                decrementCartItems.push({
                  ...cartItem,
                  decrementAmount: cartItem.quantity - remainQuantity,
                })
                remainQuantity = 0
              } else {
                remainQuantity -= cartItem.quantity
                validCartItems.push(cartItem)
              }
            }
          } else {
            validCartItems.push(...comMeta.cartItems)
          }
        }
      }
    }

    // update invalid cart items
    for (const cartItem of invalidCartItems) {
      await client.cartItem.update({
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
    }

    // update decrement cart items
    for (const cartItem of decrementCartItems) {
      await client.cartItem.update({
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
    }

    const result = await client.cartItem.findMany({
      where: {
        userId,
      },
      select: {
        quantity: true,
        options: true,
        invalid: true,
        commodityOnMenu: {
          select: {
            commodity: {
              select: {
                name: true,
                price: true,
                image: {
                  select: {
                    path: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    return {
      ...result,
      isModified: invalidCartItems.length > 0 || decrementCartItems.length > 0,
    }
  })
}

async function validateCartOptions(
  options: OrderOptions,
  targetOptionSets: OptionSet[],
) {
  // Validate options
  for (const [optionName, optionValue] of Object.entries(options)) {
    const matchOptionSet = targetOptionSets.find(
      (optionSet) => optionSet.name === optionName,
    )
    if (!matchOptionSet) {
      throw new Error(`找不到選項: ${optionName}`)
    }

    if (Array.isArray(optionValue)) {
      if (!matchOptionSet.multiSelect) {
        throw new Error(`選項不是多選: ${optionName}`)
      }
      if (
        !optionValue.every((value) => matchOptionSet.options.includes(value))
      ) {
        throw new Error(`找不到選項: ${optionName} - ${optionValue}`)
      }
    } else {
      if (matchOptionSet.multiSelect) {
        throw new Error(`選項不是單選: ${optionName}`)
      }
      if (!matchOptionSet.options.includes(optionValue)) {
        throw new Error(`找不到選項: ${optionName} - ${optionValue}`)
      }
    }
  }
}
