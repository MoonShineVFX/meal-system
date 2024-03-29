import { prisma } from './define'

/* Create Category */
type CreateCategoryArgs = {
  rootName: string
  rootOrder?: number
  subName: string
  subOrder?: number
}
export async function createCategoryPair({
  rootName,
  subName,
  rootOrder,
  subOrder,
}: CreateCategoryArgs) {
  const rootCategory = await prisma.commodityRootCategory.upsert({
    where: {
      name: rootName,
    },
    update: {
      order: rootOrder,
    },
    create: {
      name: rootName,
      order: rootOrder,
    },
  })
  return await prisma.commodityCategory.upsert({
    where: {
      rootCategoryId_name: {
        rootCategoryId: rootCategory.id,
        name: subName,
      },
    },
    update: {
      order: subOrder,
    },
    create: {
      name: subName,
      order: subOrder,
      rootCategory: {
        connect: {
          id: rootCategory.id,
        },
      },
    },
  })
}

/* Get Categories */
export async function getCategories() {
  return await prisma.commodityRootCategory.findMany({
    orderBy: {
      order: 'asc',
    },
    include: {
      childCategories: {
        orderBy: {
          order: 'asc',
        },
        include: {
          commodities: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  })
}

/* Create Category */
export async function createCategory({
  name,
  rootId,
  order,
}: {
  name: string
  rootId?: number
  order?: number
}) {
  const isSub = rootId !== undefined

  if (isSub) {
    const conflict = await prisma.commodityCategory.findFirst({
      where: {
        name,
      },
    })
    if (conflict) {
      throw new Error('已有相同名稱的分類')
    }
    return await prisma.commodityCategory.create({
      data: {
        name,
        order,
        rootCategory: {
          connect: {
            id: rootId,
          },
        },
      },
    })
  } else {
    const conflict = await prisma.commodityRootCategory.findFirst({
      where: {
        name,
      },
    })
    if (conflict) {
      throw new Error('已有相同名稱的分類')
    }
    return await prisma.commodityRootCategory.create({
      data: {
        name,
        order,
      },
    })
  }
}

/* Update Category */
export async function updateCategory({
  id,
  name,
  type,
}: {
  id: number
  name: string
  type: 'root' | 'sub'
}) {
  if (type === 'root') {
    const conflict = await prisma.commodityRootCategory.findFirst({
      where: {
        name,
        NOT: {
          id,
        },
      },
    })
    if (conflict) {
      throw new Error('已有相同名稱的分類')
    }
    return await prisma.commodityRootCategory.update({
      where: {
        id,
      },
      data: {
        name,
      },
    })
  } else {
    const conflict = await prisma.commodityCategory.findFirst({
      where: {
        name,
        NOT: {
          id,
        },
      },
    })
    if (conflict) {
      throw new Error('已有相同名稱的分類')
    }
    return await prisma.commodityCategory.update({
      where: {
        id,
      },
      data: {
        name,
      },
    })
  }
}

/* Update categories orders */
export async function updateCategoriesOrders({
  ids,
  type,
}: {
  ids: number[]
  type: 'root' | 'sub'
}) {
  await prisma.$transaction(
    ids.map((id, index) => {
      if (type === 'root') {
        return prisma.commodityRootCategory.update({
          where: {
            id,
          },
          data: {
            order: index,
          },
        })
      } else {
        return prisma.commodityCategory.update({
          where: {
            id,
          },
          data: {
            order: index,
          },
        })
      }
    }),
  )
}

/* Update subCategories parent */
export async function updateSubCategoriesRoot({
  ids,
  rootId,
}: {
  ids: number[]
  rootId: number
}) {
  return await prisma.commodityCategory.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: {
      rootCategoryId: rootId,
    },
  })
}

/* Delete categories */
export async function deleteCategories({
  ids,
  type,
}: {
  ids: number[]
  type: 'root' | 'sub'
}) {
  await prisma.$transaction(
    ids.map((id) => {
      if (type === 'root') {
        return prisma.commodityRootCategory.delete({
          where: {
            id,
          },
        })
      } else {
        return prisma.commodityCategory.delete({
          where: {
            id,
          },
        })
      }
    }),
  )
}

/* Update commodities */
export async function updateCategoryCommodities({
  commodityIds,
  id,
}: {
  commodityIds: number[]
  id: number
}) {
  const category = await prisma.commodityCategory.findUnique({
    where: {
      id: id,
    },
    select: {
      commodities: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!category) {
    throw new Error('找不到分類')
  }

  const idsToRemove = category.commodities
    .map((c) => c.id)
    .filter((id) => !commodityIds.includes(id))

  return await prisma.commodityCategory.update({
    where: {
      id: id,
    },
    data: {
      commodities: {
        connect: [...commodityIds.map((id) => ({ id: id }))],
        disconnect: [...idsToRemove.map((id) => ({ id: id }))],
      },
    },
  })
}
