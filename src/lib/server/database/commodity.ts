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

/* Edit Commodity */
type EditCommodityArgs = CreateCommodityArgs & {
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
      optionSets: optionSets ?? [],
      imageId,
      categories: {
        connect: categoryIds?.map((id) => ({ id })) ?? [],
        disconnect: originCommodity.categories.filter(
          (category) => !categoryIds?.includes(category.id),
        ),
      },
    },
    include: {
      onMenus: true,
    },
  })

  return commodity
}

/* Get Commodities */
export async function getCommodities(props: { includeMenus?: boolean }) {
  const commodities = await prisma.commodity.findMany({
    where: {
      isDeleted: false,
    },
    include: {
      categories: true,
      image: true,
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
          }
        : undefined,
    },
    orderBy: {
      id: 'asc',
    },
  })

  return commodities as ConvertPrismaJson<typeof commodities>
}
