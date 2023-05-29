import { Prisma, PrismaClient, Supplier } from '@prisma/client'
import { prisma } from './define'

type SuppliersWithCountCOMs = Prisma.SupplierGetPayload<{
  include: {
    _count: {
      select: {
        menus: true
        commodities: true
      }
    }
  }
}>
export async function getSuppliers(props: { countCOMs?: boolean }) {
  return (await prisma.supplier.findMany({
    where: {
      isDeleted: false,
    },
    include: props.countCOMs
      ? {
          _count: {
            select: {
              menus: true,
              commodities: true,
            },
          },
        }
      : undefined,
    orderBy: {
      createdAt: 'desc',
    },
  })) as Supplier[] | SuppliersWithCountCOMs[]
}

export async function createOrUpdateSupplier(props: {
  name: string
  description?: string
  id?: number
  client?: Prisma.TransactionClient | PrismaClient
}) {
  const thisPrisma = props.client ?? prisma

  if (props.id) {
    return await thisPrisma.supplier.update({
      where: {
        id: props.id,
      },
      data: {
        name: props.name,
        description: props.description,
      },
    })
  }

  return await thisPrisma.supplier.create({
    data: {
      name: props.name,
      description: props.description,
    },
  })
}

export async function deleteSuppliers(props: { ids: number[] }) {
  return await prisma.$transaction([
    prisma.commodity.updateMany({
      where: {
        supplierId: {
          in: props.ids,
        },
      },
      data: {
        isDeleted: true,
      },
    }),
    prisma.commodityOnMenu.updateMany({
      where: {
        commodity: {
          supplierId: {
            in: props.ids,
          },
        },
      },
      data: {
        isDeleted: true,
      },
    }),
    prisma.menu.updateMany({
      where: {
        supplierId: {
          in: props.ids,
        },
      },
      data: {
        isDeleted: true,
      },
    }),
    prisma.supplier.updateMany({
      where: {
        id: {
          in: props.ids,
        },
      },
      data: {
        isDeleted: true,
      },
    }),
  ])
}
