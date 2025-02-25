import { Prisma, PrismaClient } from '@prisma/client'

import { ConvertPrismaJson, OptionSet } from '@/lib/common'
import { prisma } from './define'

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
const getCommoditiesArgs = Prisma.validator<Prisma.CommodityDefaultArgs>()({
  include: {
    categories: true,
    image: true,
    supplier: {
      select: {
        name: true,
      },
    },
    onMenus: {
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
    },
  },
})
type CommodityStatistics = Awaited<
  ReturnType<typeof getCommoditiesStatistics>
>[number]
type GetCommoditiesFull = Prisma.CommodityGetPayload<
  typeof getCommoditiesArgs
> & {
  statistics: {
    day?: CommodityStatistics
    week?: CommodityStatistics
    month?: CommodityStatistics
    lastWeek?: CommodityStatistics
    lastMonth?: CommodityStatistics
  }
}

export async function getCommodities<
  FMenu extends boolean,
  FStatistics extends boolean,
>(props: {
  includeMenus?: FMenu
  includeIds?: number[]
  onlyFromSupplierId?: number
  includeStatistics?: FStatistics
}): Promise<ConvertPrismaJson<GetCommoditiesFull[]>> {
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

  if (props.includeStatistics) {
    const ids = commodities.map((com) => com.id)
    const dayStatistics = await getCommoditiesStatistics({
      ids,
      time: 'day',
    })
    const weekStatistics = await getCommoditiesStatistics({
      ids,
      time: 'week',
    })
    const monthStatistics = await getCommoditiesStatistics({
      ids,
      time: 'month',
    })
    const lastWeekStatistics = await getCommoditiesStatistics({
      ids,
      time: 'last-week',
    })
    const lastMonthStatistics = await getCommoditiesStatistics({
      ids,
      time: 'last-month',
    })

    const commoditiesWithStatistics = commodities.map((com) => {
      const statistics = {
        day: dayStatistics.find((stat) => stat.commodityId === com.id),
        week: weekStatistics.find((stat) => stat.commodityId === com.id),
        month: monthStatistics.find((stat) => stat.commodityId === com.id),
        lastWeek: lastWeekStatistics.find(
          (stat) => stat.commodityId === com.id,
        ),
        lastMonth: lastMonthStatistics.find(
          (stat) => stat.commodityId === com.id,
        ),
      }
      return {
        ...com,
        statistics,
      }
    })

    return commoditiesWithStatistics as ConvertPrismaJson<
      typeof commoditiesWithStatistics
    >
  }

  return commodities as ConvertPrismaJson<GetCommoditiesFull[]>
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

export async function getCommoditiesStatistics(props: {
  ids?: number[]
  time?: 'day' | 'week' | 'month' | 'last-week' | 'last-month'
  dateRange?: { gte: Date; lt: Date }
}) {
  const now = new Date()
  let dateRange: { gte: Date; lt: Date }
  switch (props.time) {
    case 'day':
      dateRange = {
        gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      }
      break
    case 'week':
      dateRange = {
        gte: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay() + 1,
        ),
        lt: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay() + 8,
        ),
      }
      break
    case 'month':
      dateRange = {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      }
      break
    case 'last-week':
      dateRange = {
        gte: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay() - 6,
        ),
        lt: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay() + 1,
        ),
      }
      break
    case 'last-month':
      dateRange = {
        gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        lt: new Date(now.getFullYear(), now.getMonth(), 1),
      }
      break
    default:
      if (!props.dateRange) {
        throw new Error('Date range or time must be provided')
      }
      dateRange = props.dateRange
  }

  return await prisma.orderItem.groupBy({
    by: ['commodityId'],
    where: {
      commodityId: props.ids
        ? {
            in: props.ids,
          }
        : undefined,
      order: {
        timeCanceled: null,
        createdAt: dateRange,
      },
    },
    _sum: {
      quantity: true,
      price: true,
    },
  })
}
