import { MenuType, Prisma, PrismaClient, Menu } from '@prisma/client'
import lzString from 'lz-string'

import { validateCartItemCreatable } from './cart'
import { ConvertPrismaJson, OrderOptions } from '@/lib/common'
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
  supplierId?: number
  isEdit?: boolean
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
  isEdit,
  supplierId,
}: CreateMenuArgs) {
  const thisPrisma = client ?? prisma

  // Validate date and type
  if (!date && !['LIVE', 'RETAIL'].includes(type)) {
    throw new Error('date is required for non-main menu')
  }

  // Check menu existence
  const existMenu = await thisPrisma.menu.findFirst({
    where: { type, date, isDeleted: false },
  })

  if (existMenu && !isEdit) {
    throw new Error('已經有該設定的菜單')
  } else if (!existMenu && isEdit) {
    throw new Error('找不到該菜單')
  }

  if (isEdit) {
    return await thisPrisma.menu.update({
      where: {
        id: existMenu?.id,
      },
      data: {
        name,
        description,
        publishedDate,
        closedDate,
        limitPerUser,
        isDeleted: false,
      },
    })
  } else {
    return await thisPrisma.menu.create({
      data: {
        name,
        description,
        publishedDate,
        closedDate,
        limitPerUser,
        supplierId,
        type,
        date,
      },
    })
  }
}

/* Get active menus */
const GetActiveMenusDetailArgs = Prisma.validator<Prisma.MenuArgs>()({
  include: {
    commodities: {
      where: {
        isDeleted: false,
      },
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

/* Get Menu reservation list with user order count */
export async function getReservationMenusForUser({
  userId,
}: {
  userId: string
}) {
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
        where: {
          isDeleted: false,
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

/* Get Menu reservation list from specific month */
export async function getReservationMenusSince({
  year,
  month,
}: {
  year: number
  month: number
}) {
  const sinceDate = new Date(year, month - 1, 1)
  sinceDate.setHours(0, 0, 0, 0)
  const menus = await prisma.menu.findMany({
    where: {
      isDeleted: false,
      date: {
        gte: sinceDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
    select: {
      type: true,
      date: true,
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
  let menuOrderedCount = 0

  // coms
  const validatedComs = menu.commodities?.map((com) => {
    const orderedCount = com.orderItems.reduce(
      (acc, cur) => {
        if (cur.order.userId === userId) {
          menuOrderedCount += cur.quantity
          acc.user += cur.quantity
        }
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
        menuOrderedCount += cartItem.quantity
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
  if (menu.limitPerUser !== 0 && menuOrderedCount >= menu.limitPerUser) {
    menuUnavailableReasons.push(
      MenuUnavailableReason.MENU_LIMIT_PER_USER_EXCEEDED,
    )
  }
  const maxQuantity = Math.min(
    menu.limitPerUser !== 0 ? menu.limitPerUser - menuOrderedCount : 999, // Infinity will turn to -2 in client [BUG]
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
    const cartCount = await client.cartItem.count({
      where: {
        menuId: menuId,
      },
    })

    if (orderCount + cartCount > 0) {
      log(
        'menu has been ordered or added to cart, cannot be deleted, acrhived instead',
      )
      // invalidate cart items
      await client.cartItem.updateMany({
        where: {
          menuId: menuId,
        },
        data: {
          invalid: true,
        },
      })

      await client.commodityOnMenu.updateMany({
        where: {
          menuId: menuId,
        },
        data: {
          isDeleted: true,
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

export async function getRetailCOM(args: {
  userId: string
  cipher: string
  client?: Prisma.TransactionClient | PrismaClient
}) {
  const thisClient = args.client ?? prisma

  const jsonString = lzString.decompressFromEncodedURIComponent(args.cipher)

  const result: {
    commodityId: number
    menuId: number
    options?: OrderOptions
  } = JSON.parse(jsonString)

  const com = await getCommodityOnMenu({
    commodityId: result.commodityId,
    menuId: result.menuId,
    client: thisClient,
  })

  if (!com) {
    throw new Error('Commodity not found')
  }

  const sortedOptions = await validateCartItemCreatable({
    commodityId: result.commodityId,
    menuId: result.menuId,
    options: result.options ?? {},
    quantity: 1,
    userId: args.userId,
    client: thisClient,
  })

  return {
    ...com,
    options: sortedOptions,
  }
}

export async function getCommodityOnMenu(args: {
  commodityId: number
  menuId: number
  client?: Prisma.TransactionClient | PrismaClient
}) {
  const thisClient = args.client ?? prisma
  const { commodityId, menuId } = args

  return await thisClient.commodityOnMenu.findFirst({
    where: {
      menuId,
      commodityId,
      isDeleted: false,
      commodity: {
        isDeleted: false,
      },
      menu: {
        isDeleted: false,
      },
    },
    include: {
      menu: true,
      commodity: {
        include: {
          image: true,
        },
      },
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

export async function removeCommoditiesFromMenu(args: {
  excludeCommodityIds: number[]
  menuId: number
  client?: Prisma.TransactionClient | PrismaClient
}) {
  const { excludeCommodityIds, menuId, client } = args
  const thisPrisma = client ?? prisma

  return await thisPrisma.commodityOnMenu.updateMany({
    where: {
      commodityId: {
        notIn: excludeCommodityIds,
      },
      menuId: menuId,
    },
    data: {
      isDeleted: true,
    },
  })
}
