import { Prisma } from '@prisma/client'
import { prisma } from './define'

export async function createOrUpdateOrderRecord({
  userId,
  commodityId,
  menuType,
  client,
}: {
  userId: string
  commodityId: number
  menuType: string
  client?: Prisma.TransactionClient
}) {
  const thisPrisma = client ?? prisma

  // Upsert: update updatedAt if exists, create if not
  await thisPrisma.orderRecord.upsert({
    where: {
      userId_commodityId_menuType: {
        userId,
        commodityId,
        menuType,
      },
    },
    update: {
      updatedAt: new Date(),
    },
    create: {
      userId,
      commodityId,
      menuType,
    },
  })

  // Maintain 10-record limit
  const recordCount = await thisPrisma.orderRecord.count({
    where: { userId, menuType },
  })

  if (recordCount > 10) {
    const recordsToDelete = await thisPrisma.orderRecord.findMany({
      where: { userId, menuType },
      orderBy: { updatedAt: 'asc' },
      take: recordCount - 10,
      select: { id: true },
    })

    await thisPrisma.orderRecord.deleteMany({
      where: {
        id: {
          in: recordsToDelete.map((r) => r.id),
        },
      },
    })
  }
}

export async function getOrderRecordsByUser({
  userId,
  menuType,
  limit = 10,
  client,
}: {
  userId: string
  menuType: string
  limit?: number
  client?: Prisma.TransactionClient
}) {
  const thisPrisma = client ?? prisma

  return await thisPrisma.orderRecord.findMany({
    where: { userId, menuType },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: {
      commodityId: true,
      updatedAt: true,
    },
  })
}
