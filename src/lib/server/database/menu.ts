import { Menu, MenuType, OrderStatus } from '@prisma/client'

import type { OptionSet } from '@/lib/common'
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
  if (await getMenu(type, undefined, date)) {
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

type GetMenuResult = Pick<
  Menu,
  | 'id'
  | 'date'
  | 'name'
  | 'description'
  | 'limitPerUser'
  | 'publishedDate'
  | 'closedDate'
> & { userOrderedCount?: number }
export async function getMenu(
  menuId: number,
  userId?: string,
): Promise<GetMenuResult>
export async function getMenu(
  type: MenuType,
  userId?: string,
  date?: Date,
): Promise<GetMenuResult>
export async function getMenu(
  menuIdOrType: number | MenuType,
  userId?: string,
  date?: Date,
) {
  const isGetById = typeof menuIdOrType === 'number'

  // Validate date and type
  if (!isGetById && !date && menuIdOrType !== MenuType.MAIN) {
    throw new Error('date is required for non-main menu')
  }

  // Get order
  const menu = await prisma.menu.findFirst({
    where: {
      type: !isGetById ? (menuIdOrType as MenuType) : undefined,
      date,
      id: isGetById ? menuIdOrType : undefined,
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
    },
  })

  if (!menu) {
    throw new Error('menu not found')
  }

  // Get user orders of the menu
  if (userId) {
    const menuOrders = await prisma.orderItem.aggregate({
      where: {
        menuId: menu.id,
        order: {
          userId,
          status: {
            not: 'CANCELED',
          },
        },
      },
      _sum: {
        quantity: true,
      },
    })
    return {
      ...menu,
      userOrderedCount: menuOrders._sum?.quantity ?? 0,
    }
  } else {
    return menu
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
    update: updateData,
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

export async function getCommoditiesOnMenu(
  menuId: number,
  userId: string,
  commodityId?: number,
) {
  const COMs = await prisma.commodityOnMenu.findMany({
    where: {
      menuId,
      commodityId,
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
              width: true,
              height: true,
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
  })

  // Calculate sum of ordered quantity and user's ordered quantity
  return COMs.map((COM) => {
    const orderedCount = COM.orderItems.reduce(
      (acc, cur) => ({
        total: acc.total + cur.quantity,
        user: acc.user + (cur.order.userId === userId ? cur.quantity : 0),
      }),
      {
        total: 0,
        user: 0,
      },
    )

    const { orderItems, ...rest } = COM

    return {
      ...rest,
      orderedCount,
    }
  })
}

export async function createCartItem(
  userId: string,
  menuId: number,
  commodityId: number,
  quantity: number,
  options: string[],
) {
  return await prisma.$transaction(async (client) => {
    // Validate quantity
    const menu = await client.menu.findUnique({
      where: {
        id: menuId,
      },
    })
    if (!menu) {
      throw new Error('menu not found')
    }

    const now = new Date()
    if (
      (menu.publishedDate && now < menu.publishedDate) ||
      (menu.closedDate && now > menu.closedDate)
    ) {
      throw new Error('menu is not available')
    }

    const COMs = await getCommoditiesOnMenu(menuId, userId, commodityId)
    if (COMs.length === 0) {
      throw new Error('commodity not found')
    }
    const COM = COMs[0]

    const maxQuantity = Math.min(
      COM.stock !== 0 ? COM.stock - COM.orderedCount.total : 99,
      COM.limitPerUser !== 0 ? COM.limitPerUser - COM.orderedCount.user : 99,
      menu.limitPerUser !== 0 ? menu.limitPerUser - COM.orderedCount.total : 99,
    )
    if (quantity > maxQuantity) {
      throw new Error(`quantity exceeds limit: ${maxQuantity}`)
    }

    // Create cart item
    return await client.cartItem.create({
      data: {
        userId,
        menuId,
        commodityId,
        quantity,
        options,
      },
    })
  })
}
