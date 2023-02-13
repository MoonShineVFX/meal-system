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
              menu: {
                select: {
                  name: true,
                  type: true,
                  date: true,
                },
              },
            },
          }
        : undefined,
    },
  })

  return commodities as ConvertPrismaJson<typeof commodities>
}
