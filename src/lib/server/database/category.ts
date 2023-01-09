import { prisma } from './define'

/* Create Category */
type CreateCategoryArgs = {
  rootName: string
  rootOrder?: number
  subName: string
  subOrder?: number
}
export async function createCategory({
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
        select: {
          _count: {
            select: {
              commodities: true,
            },
          },
        },
      },
    },
  })
}
