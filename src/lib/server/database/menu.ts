import { MenuType, Prisma, PrismaClient, Menu } from '@prisma/client'

import { ConvertPrismaJson } from '@/lib/common'
import {
  MenuUnavailableReason,
  ComUnavailableReason,
  settings,
} from '@/lib/common'
import { prisma, log } from './define'

/* Create Menu */
type CommonCreateMenuArgs = {
  type: Extract<MenuType, 'LIVE' | 'RETAIL'>
  date?: never
}
type ReserveCreateMenuArgs = {
  type: Exclude<MenuType, 'LIVE' | 'RETAIL'>
  date: Date
}
type CreateMenuArgs = {
  name?: string
  description?: string
  publishedDate?: Date | null
  closedDate?: Date | null
  limitPerUser?: number
  client?: Prisma.TransactionClient | PrismaClient
} & (CommonCreateMenuArgs | ReserveCreateMenuArgs)
/** Create menu, if type is not main, date required */
export async function createMenu({
  type,
  name,
  description,
  date,
  publishedDate,
  closedDate,
  limitPerUser,
  client,
}: CreateMenuArgs) {
  const thisPrisma = client ?? prisma

  // Validate date and type
  if (!date && !['LIVE', 'RETAIL'].includes(type)) {
    throw new Error('date is required for non-main menu')
  }

  // Check menu existence
  const collisionCount = await thisPrisma.menu.count({
    where: { type, date, isDeleted: false },
  })
  if (collisionCount > 0) {
    throw new Error('已經有該設定的菜單')
  }

  return await thisPrisma.menu.create({
    data: {
      date,
      type,
      name,
      description,
      publishedDate,
      closedDate,
      limitPerUser,
    },
    include: {
      commodities: {
        select: {
          commodity: {
            select: {
              id: true,
            },
          },
          limitPerUser: true,
          stock: true,
        },
      },
    },
  })
}

/* Get active menus */
const GetActiveMenusDetailArgs = Prisma.validator<Prisma.MenuArgs>()({
  include: {
    commodities: {
      select: {
        commodity: {
          select: {
            id: true,
            name: true,
          },
        },
        limitPerUser: true,
        stock: true,
      },
    },
    _count: {
      select: {
        orders: {
          where: {
            timeCanceled: null,
          },
        },
      },
    },
  },
})
type GetActiveMenusDetailResult = Prisma.MenuGetPayload<
  typeof GetActiveMenusDetailArgs
>
export async function getActiveMenus(props: {
  includeIds?: number[]
  includeClosed?: boolean
  withDetails?: boolean
}): Promise<GetActiveMenusDetailResult[] | Menu[]> {
  const now = new Date()
  const menusFindArgs: Prisma.MenuWhereInput = {
    OR: [
      {
        date: { not: null },
        isDeleted: false,
        closedDate: props.includeClosed ? undefined : { gte: now },
      },
      {
        date: null,
        isDeleted: false,
        type: {
          in: ['LIVE', 'RETAIL'],
        },
      },
      {
        id: { in: props.includeIds },
      },
    ],
  }

  if (props.withDetails) {
    return await prisma.menu.findMany({
      where: menusFindArgs,
      include: GetActiveMenusDetailArgs.include,
    })
  }

  return await prisma.menu.findMany({
    where: menusFindArgs,
  })
}

/* Get Menu reservation list */
export async function getReservationMenus({ userId }: { userId: string }) {
  const now = new Date()
  const menus = await prisma.menu.findMany({
    where: {
      date: { not: null },
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
      type: Extract<MenuType, 'LIVE' | 'RETAIL'>
      date?: never
    }
  | {
      type: Exclude<MenuType, 'LIVE' | 'RETAIL'>
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
  if (!isGetById && !date && type && !['LIVE', 'RETAIL'].includes(type)) {
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
                      name: true,
                      order: true,
                      rootCategory: {
                        select: {
                          name: true,
                          order: true,
                        },
                      },
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

/* Add COM */
type AddCommodityToMenuArgs = {
  commodityId: number
  menuId: number
  limitPerUser?: number
  stock?: number
  client?: Prisma.TransactionClient | PrismaClient
}
export async function addCommodityToMenu({
  commodityId,
  menuId,
  limitPerUser,
  stock,
  client,
}: AddCommodityToMenuArgs) {
  const thisPrisma = client ?? prisma
  const updateData = {
    limitPerUser,
    stock,
  } satisfies Prisma.CommodityOnMenuUpdateInput
  return await thisPrisma.commodityOnMenu.upsert({
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

export async function removeCommodityFromMenus(args: {
  commodityId: number
  excludeMenuIds: number[]
}) {
  const { commodityId, excludeMenuIds } = args
  return await prisma.commodityOnMenu.updateMany({
    where: {
      commodityId,
      menuId: {
        notIn: excludeMenuIds,
      },
    },
    data: {
      isDeleted: true,
    },
  })
}
