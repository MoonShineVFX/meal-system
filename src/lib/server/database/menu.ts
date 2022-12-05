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
  subCategoryId?: number,
  imageUrl?: string,
) {
  const commodity = await prisma.commodity.create({
    data: {
      name,
      description,
      price,
      optionSets: optionSets ?? [],
      subCategoryId,
      imageUrl,
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

export async function createSubCategory(
  mainCategoryName: string,
  subCategoryName: string,
) {
  const subCategory = await prisma.commoditySubCategory.upsert({
    where: {
      name: subCategoryName,
    },
    update: {},
    create: {
      name: subCategoryName,
      mainCategory: {
        connectOrCreate: {
          where: {
            name: mainCategoryName,
          },
          create: {
            name: mainCategoryName,
          },
        },
      },
    },
    include: {
      mainCategory: true,
    },
  })

  // Check if main category is correct
  if (subCategory) {
    if (subCategory.mainCategory.name !== mainCategoryName) {
      throw new Error(
        `Sub category ${subCategoryName} is already exists and not under main category ${mainCategoryName}`,
      )
    }
  }

  return subCategory
}

export async function getCommoditiesOnMenu(menuId: number, userId: string) {
  const menuCommodities = await prisma.commodityOnMenu.findMany({
    where: {
      menuId,
      isDeleted: false,
      commodity: {
        isDeleted: false,
      },
    },
    include: {
      commodity: {
        include: {
          subCateogry: {
            include: {
              mainCategory: true,
            },
          },
        },
      },
      _count: {
        select: {
          orderItems: {
            where: {
              order: {
                status: 'SUCCESS',
              },
            },
          },
        },
      },
    },
  })

  const orderedFromMenu = await prisma.orderItem.groupBy({
    by: ['commodityId'],
    where: {
      menuId,
      order: {
        userId,
        status: 'SUCCESS',
      },
    },
    _count: {
      commodityId: true,
    },
  })

  return {
    menuCommodities,
    orderedFromMenu,
  }
}
