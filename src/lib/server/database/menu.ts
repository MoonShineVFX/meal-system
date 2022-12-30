import { MenuType, Prisma, PrismaClient } from '@prisma/client'

import { OptionSet, ConvertPrismaJson } from '@/lib/common'
import {
  MenuUnavailableReason,
  ComUnavailableReason,
  settings,
} from '@/lib/common'
import { prisma, log } from './define'

/* Create Menu */
type MainCreateMenuArgs = {
  type: Extract<MenuType, 'MAIN'>
  date?: never
}
type CommonCreateMenuArgs = {
  type: Exclude<MenuType, 'MAIN'>
  date: Date
}
type CreateMenuArgs = {
  name?: string
  description?: string
  publishedDate?: Date
  closedDate?: Date
  limitPerUser?: number
} & (MainCreateMenuArgs | CommonCreateMenuArgs)
/** Create menu, if type is not main, date required */
export async function createMenu({
  type,
  name,
  description,
  date,
  publishedDate,
  closedDate,
  limitPerUser,
}: CreateMenuArgs) {
  // Validate date and type
  if (!date && type !== MenuType.MAIN) {
    throw new Error('date is required for non-main menu')
  }

  // Check menu existence
  const collisionCount = await prisma.menu.count({
    where: { type, date, isDeleted: false },
  })
  if (collisionCount > 0) {
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

/* Get Menu reservation list */
export async function getReservationMenus({ userId }: { userId: string }) {
  const now = new Date()
  const menus = await prisma.menu.findMany({
    where: {
      type: { not: MenuType.MAIN },
      isDeleted: false,
      publishedDate: { lte: now },
      closedDate: { gte: now },
    },
    select: {
      id: true,
      type: true,
      date: true,
      name: true,
      description: true,
      closedDate: true,
      commodities: {
        take: 6, // take 6 commodities for reservation ui width
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          commodity: {
            select: {
              id: true,
              name: true,
              image: {
                select: {
                  path: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          orders: {
            where: {
              timeCanceled: null,
              userId,
            },
          },
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  })

  return menus
}

/* Get Menu and COMs */
type GetMenuFromType = { menuId?: never } & (
  | {
      type: Extract<MenuType, 'MAIN'>
      date?: never
    }
  | {
      type: Exclude<MenuType, 'MAIN'>
      date: Date
    }
)
type GetMenuFromId = {
  menuId: number
  type?: never
  date?: never
}
type GetMenuWithComsArgs = {
  menu: GetMenuFromId | GetMenuFromType
  userId: string
  limitCommodityIds?: number[]
  excludeCartItems?: boolean
  client?: Prisma.TransactionClient | PrismaClient
}
/** Get menu and return with unavailableReasons from validation */
export async function getMenuWithComs({
  menu: { type, date, menuId },
  userId,
  limitCommodityIds,
  excludeCartItems,
  client,
}: GetMenuWithComsArgs) {
  if (!type && !menuId) {
    throw new Error('type or menuId is required')
  }

  const isGetById = !!menuId
  const thisPrisma = client ?? prisma

  // Validate date and type
  if (!isGetById && !date && type !== MenuType.MAIN) {
    throw new Error('date is required for non-main menu')
  }

  // Get menu
  const rawMenu = await thisPrisma.menu.findFirst({
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
      type: true,
      description: true,
      limitPerUser: true,
      publishedDate: true,
      closedDate: true,
      commodities: userId
        ? {
            where: {
              commodityId: limitCommodityIds
                ? { in: limitCommodityIds }
                : undefined,
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
                      mainOrder: true,
                      subOrder: true,
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
                    timeCanceled: null,
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

  if (!rawMenu) {
    throw new Error('menu not found')
  }
  const menu = rawMenu as ConvertPrismaJson<typeof rawMenu>

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
        cart: 0,
      },
    )

    if (!excludeCartItems) {
      for (const cartItem of com.cartItems) {
        menuOrderedCount.user += cartItem.quantity
        orderedCount.user += cartItem.quantity
        orderedCount.cart += cartItem.quantity
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
    if (orderedCount.cart >= settings.MENU_MAX_QUANTITY_PER_ORDER) {
      comUnavailableReasons.push(
        ComUnavailableReason.COM_LIMIT_PER_ORDER_EXCEEDED,
      )
    }

    // calculate max quantity
    const maxQuantity = Math.min(
      com.stock !== 0
        ? com.stock - orderedCount.total
        : settings.MENU_MAX_QUANTITY_PER_ORDER,
      com.limitPerUser !== 0
        ? com.limitPerUser - orderedCount.user
        : settings.MENU_MAX_QUANTITY_PER_ORDER,
      settings.MENU_MAX_QUANTITY_PER_ORDER - orderedCount.cart,
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
    menu.limitPerUser !== 0
      ? menu.limitPerUser - menuOrderedCount.total
      : Infinity,
  )

  // lower coms max quantity if menu max quantity is lower
  if (maxQuantity < settings.MENU_MAX_QUANTITY_PER_ORDER) {
    for (const com of validatedComs) {
      com.maxQuantity = Math.min(com.maxQuantity, maxQuantity)
    }
  }

  return {
    ...menu,
    commodities: validatedComs,
    unavailableReasons: menuUnavailableReasons,
    maxQuantity,
  }
}

export async function deleteMenu(args: { menuId: number }) {
  const { menuId } = args
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

/* Create Commodity */
type CreateCommodityArgs = {
  name: string
  price: number
  description?: string
  optionSets?: OptionSet[]
  categoryIds?: number[]
  imageId?: string
}
export async function createCommodity({
  name,
  price,
  description,
  optionSets,
  categoryIds,
  imageId,
}: CreateCommodityArgs) {
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

/* Add COM */
type AddCommodityToMenuArgs = {
  commodityId: number
  menuId: number
  limitPerUser?: number
  stock?: number
}
export async function addCommodityToMenu({
  commodityId,
  menuId,
  limitPerUser,
  stock,
}: AddCommodityToMenuArgs) {
  const updateData = {
    limitPerUser,
    stock,
  } satisfies Prisma.CommodityOnMenuUpdateInput
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
      ...updateData,
      menuId,
      commodityId,
    },
  })
}

/* Create Category */
type CreateCategoryArgs = {
  mainName: string
  subName: string
  mainOrder?: number
  subOrder?: number
}
export async function createCategory({
  mainName,
  subName,
  mainOrder,
  subOrder,
}: CreateCategoryArgs) {
  return await prisma.commodityCategory.upsert({
    where: {
      mainName_subName: {
        mainName,
        subName,
      },
    },
    update: {
      mainOrder,
      subOrder,
    },
    create: {
      mainName,
      subName,
      mainOrder,
      subOrder,
    },
  })
}
