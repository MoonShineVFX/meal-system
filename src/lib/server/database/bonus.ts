import { settings } from '@/lib/common'
import { prisma } from './define'

export async function createOrUpdateBonus(props: {
  id?: number
  amount: number
  note?: string
  userIds: string[]
  validAt?: Date
}) {
  if (props.id) {
    await prisma.bonus.update({
      where: {
        id: props.id,
      },
      data: {
        amount: props.amount,
        note: props.note,
        users: {
          connect: props.userIds.map((id) => ({
            id,
          })),
        },
        validAt: props.validAt,
      },
    })
  } else {
    await prisma.bonus.create({
      data: {
        amount: props.amount,
        note: props.note,
        users: {
          connect: props.userIds.map((id) => ({
            id,
          })),
        },
        validAt: props.validAt,
      },
    })
  }

  // invalidate user bonus check
  await prisma.user.updateMany({
    where: {
      id: {
        in: props.userIds,
      },
    },
    data: {
      lastBonusCheckTime: null,
    },
  })
}

export async function deleteBonus(id: number) {
  return await prisma.bonus.update({
    where: {
      id,
    },
    data: {
      isDeleted: true,
    },
  })
}

export async function getBonus({ cursor }: { cursor?: number }) {
  const bonus = await prisma.bonus.findMany({
    where: {
      isDeleted: false,
    },
    take: settings.TRANSACTIONS_PER_QUERY + 1,
    orderBy: {
      createdAt: 'desc',
    },
    cursor: cursor
      ? {
          id: cursor,
        }
      : undefined,
    include: {
      redeemUsers: {
        select: {
          id: true,
          name: true,
        },
      },
      users: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
  let nextCursor: number | undefined = undefined
  if (bonus.length > settings.TRANSACTIONS_PER_QUERY) {
    nextCursor = bonus.pop()!.id
  }
  return {
    bonus,
    nextCursor,
  }
}
