import { PrismaClient, Prisma } from '@prisma/client'

import { prisma } from './define'
import { OptionSet, ConvertPrismaJson } from '@/lib/common'

/* Create Commodity */
type CreateCommodityArgs = {
  name: string
  price: number
  description?: string
  optionSets?: OptionSet[]
  categoryIds?: number[]
  imageId?: string
  supplierId?: number
  client?: Prisma.TransactionClient | PrismaClient
}
export async function createCommodity({
  name,
  price,
  description,
  optionSets,
  categoryIds,
  imageId,
  client,
  supplierId,
}: CreateCommodityArgs) {
  const thisPrisma = client ?? prisma
  const commodity = await thisPrisma.commodity.create({
    data: {
      name,
      description,
      price,
      optionSets: optionSets ?? [],
      imageId,
      categories: {
        connect: categoryIds?.map((id) => ({ id })) ?? [],
      },
      supplierId,
    },
  })

  return commodity
}

/* Edit Commodity */
type EditCommodityArgs = Partial<CreateCommodityArgs> & {
  id: number
}
export async function editCommodity({
  id,
  name,
  price,
  description,
  optionSets,
  categoryIds,
  imageId,
  supplierId,
}: EditCommodityArgs) {
  const originCommodity = await prisma.commodity.findUnique({
    where: {
      id,
    },
    include: {
      categories: true,
    },
  })

  if (!originCommodity) {
    throw new Error('Commodity not found')
  }

  const commodity = await prisma.commodity.update({
    where: {
      id,
    },
    data: {
      name,
      description,
      price,
      optionSets: optionSets
        ? optionSets.map((os, index) => ({ ...os, order: index }))
        : undefined,
      imageId,
      categories: categoryIds
        ? {
            connect: categoryIds.map((id) => ({ id })),
            disconnect: originCommodity.categories
              .filter((category) => !categoryIds?.includes(category.id))
              .map((cat) => ({ id: cat.id })),
          }
        : undefined,
      supplierId,
    },
    include: {
      onMenus: {
        where: {
          isDeleted: false,
        },
      },
    },
  })

  return commodity
}

/* Get Commodities */
export async function getCommodities(props: {
  includeMenus?: boolean
  includeIds?: number[]
  onlyFromSupplierId?: number
}) {
  const commodities = await prisma.commodity.findMany({
    where: {
      OR: [
        {
          isDeleted: false,
        },
        ...(props.includeIds
          ? [
              {
                id: {
                  in: props.includeIds,
                },
              },
            ]
          : []),
      ],
      supplierId: props.onlyFromSupplierId ?? null,
    },
    include: {
      categories: true,
      image: true,
      supplier: {
        select: {
          name: true,
        },
      },
      onMenus: props.includeMenus
        ? {
            select: {
              limitPerUser: true,
              stock: true,
              menu: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  date: true,
                },
              },
            },
            where: {
              isDeleted: false,
            },
          }
        : undefined,
    },
    orderBy: {
      id: 'asc',
    },
  })

  return commodities as ConvertPrismaJson<typeof commodities>
}

/* Delete Commodities */
export async function deleteCommodities(props: { ids: number[] }) {
  await prisma.$transaction([
    prisma.commodity.updateMany({
      where: {
        id: {
          in: props.ids,
        },
      },
      data: {
        isDeleted: true,
      },
    }),
    prisma.commodityOnMenu.updateMany({
      where: {
        commodityId: {
          in: props.ids,
        },
      },
      data: {
        isDeleted: true,
      },
    }),
  ])
}
