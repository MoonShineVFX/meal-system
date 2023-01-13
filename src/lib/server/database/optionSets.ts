import { prisma } from './define'
import { OptionSet, ConvertPrismaJson } from '@/lib/common'

export async function createOptionSetsTemplate(props: {
  name: string
  optionSets?: OptionSet[]
  order?: number
}) {
  const { name, optionSets, order } = props

  const conflict = await prisma.commodityOptionSetsTemplate.findFirst({
    where: {
      name,
    },
  })
  if (conflict) {
    throw new Error('選項名稱重複')
  }

  await prisma.commodityOptionSetsTemplate.create({
    data: {
      name,
      optionSets: optionSets || [],
      order,
    },
  })
}

export async function getOptionSetsTemplates() {
  const optionSets = await prisma.commodityOptionSetsTemplate.findMany({
    orderBy: {
      order: 'asc',
    },
  })
  return optionSets as ConvertPrismaJson<typeof optionSets>
}

export async function updateOptionSetsTemplate(props: {
  id: number
  name?: string
  optionSets?: OptionSet[]
}) {
  const { id, name, optionSets } = props
  if (!name && !optionSets) {
    throw new Error('沒有更新內容')
  }

  const optionSetsTemplate = await prisma.commodityOptionSetsTemplate.update({
    where: {
      id,
    },
    data: {
      optionSets,
    },
  })
  return optionSetsTemplate
}

export async function updateOptionSetsOrders({ ids }: { ids: number[] }) {
  await prisma.$transaction(
    ids.map((id, index) => {
      return prisma.commodityOptionSetsTemplate.update({
        where: {
          id,
        },
        data: {
          order: index,
        },
      })
    }),
  )
}

export async function deleteOptionSets({ ids }: { ids: number[] }) {
  await prisma.commodityOptionSetsTemplate.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  })
}
