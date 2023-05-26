import { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from './define'

export async function getSuppliers() {
  return await prisma.supplier.findMany({
    where: {
      isDeleted: false,
    },
  })
}

export async function createSupplier(props: {
  name: string
  description?: string
  client?: Prisma.TransactionClient | PrismaClient
}) {
  const thisPrisma = props.client ?? prisma
  return await thisPrisma.supplier.create({
    data: {
      name: props.name,
      description: props.description,
    },
  })
}
