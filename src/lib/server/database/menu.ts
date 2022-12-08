import { MenuType } from '@prisma/client'

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
  if (await getMenu(type, date)) {
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

export async function getMenu(type: MenuType, date?: Date) {
  // Validate date and type
  if (!date && type !== MenuType.MAIN) {
    throw new Error('date is required for non-main menu')
  }

  return await prisma.menu.findFirst({
    where: {
      type,
      date,
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

export async function getCommoditiesOnMenu(menuId: number) {
  return await prisma.commodityOnMenu.findMany({
    where: {
      menuId,
      isDeleted: false,
      commodity: {
        isDeleted: false,
      },
    },
    select: {
      limitPerUser: true,
      SKU: true,
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
      _count: {
        select: {
          orderItems: {
            where: {
              order: {
                status: {
                  not: 'CANCELED',
                },
              },
            },
          },
        },
      },
    },
  })
}

export async function getUserOrdersOnMenu(userId: string, menuId: number) {
  return await prisma.orderItem.groupBy({
    by: ['commodityId'],
    where: {
      menuId,
      order: {
        userId,
        status: {
          not: 'CANCELED',
        },
      },
    },
    _count: {
      commodityId: true,
    },
  })
}
