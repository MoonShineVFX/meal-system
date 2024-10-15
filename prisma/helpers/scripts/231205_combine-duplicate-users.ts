import { prismaCient } from '../../../src/lib/server/database'

async function findDuplicateOrderedUsers() {
  console.log('>> Find duplicate user transactions')

  const users = await prismaCient.user.findMany({
    select: {
      id: true,
      name: true,
      pointBalance: true,
      creditBalance: true,
      lastPointRechargeTime: true,
      _count: {
        select: {
          orders: {
            where: {
              timeCompleted: {
                not: null,
              },
            },
          },
        },
      },
    },
  })

  // find duplicate user with case insensitive id
  const usersSet: Record<string, typeof users> = {}
  for (const user of users) {
    if (usersSet[user.name]) {
      usersSet[user.name].push(user)
    } else {
      usersSet[user.name] = [user]
    }
  }

  const result = Object.entries(usersSet).filter(
    ([_, users]) => users.length > 1,
  )

  result.forEach(([name, users]) => {
    console.log(name)
    console.log(
      'id: ',
      users.map((user) => user.id),
    )
    console.log(
      'pointBalance: ',
      users.map((user) => user.pointBalance),
    )
    console.log(
      'creditBalance: ',
      users.map((user) => user.creditBalance),
    )
    console.log(
      'orders: ',
      users.map((user) => user._count.orders),
    )
  })

  return result.map(([_, users]) =>
    users
      .sort((a, b) => {
        if (a._count.orders > 0 && b._count.orders === 0) return -1

        return (
          (b.lastPointRechargeTime?.getTime() ?? 0) -
          (a.lastPointRechargeTime?.getTime() ?? 0)
        )
      })
      .map((user) => user.id),
  )
}

async function combineUsers(userIds: string[]) {
  const mainId = userIds[0]
  const otherIds = userIds.slice(1)

  console.log(`>> Combine users ${userIds.join(', ')}`)
  for (const otherId of otherIds) {
    await prismaCient.$transaction(async (tx) => {
      // Find transaction that need to apply decrement
      const record = await tx.transaction.aggregate({
        where: {
          type: 'PAYMENT',
          ordersForPayment: {
            every: {
              userId: otherId,
              timeCompleted: {
                gte: new Date('2023-11-01T00:00:00.000+08:00'),
              },
            },
          },
          sourceUserId: otherId,
        },
        _sum: {
          pointAmount: true,
          creditAmount: true,
        },
      })

      const {
        _sum: { creditAmount, pointAmount },
      } = record
      await tx.user.update({
        where: {
          id: mainId,
        },
        data: {
          creditBalance: creditAmount
            ? {
                decrement: creditAmount,
              }
            : undefined,
          pointBalance: pointAmount
            ? {
                decrement: pointAmount,
              }
            : undefined,
        },
      })
      console.log(
        `>> Decrement ${creditAmount} credit and ${pointAmount} point from user ${mainId}`,
      )

      // Transfer all relations
      console.log(
        await tx.order.updateMany({
          where: {
            userId: otherId,
          },
          data: {
            userId: mainId,
          },
        }),
      )
      console.log(
        await tx.deposit.updateMany({
          where: {
            userId: otherId,
          },
          data: {
            userId: mainId,
          },
        }),
      )
      console.log(
        await tx.transaction.updateMany({
          where: {
            sourceUserId: otherId,
          },
          data: {
            sourceUserId: mainId,
          },
        }),
      )
      console.log(
        await tx.transaction.updateMany({
          where: {
            type: {
              not: 'RECHARGE',
            },
            targetUserId: otherId,
          },
          data: {
            targetUserId: mainId,
          },
        }),
      )

      await tx.transaction.deleteMany({
        where: {
          targetUserId: otherId,
        },
      })
      await tx.user.delete({
        where: {
          id: otherId,
        },
      })

      console.log(`>> Delete user ${otherId}`)
    })
  }
}

async function lowerCaseAllUserIds() {
  const users = await prismaCient.user.findMany({
    select: {
      id: true,
    },
  })

  let count = 0
  for (const user of users) {
    if (user.id === user.id.toLowerCase()) continue
    await prismaCient.user.update({
      where: {
        id: user.id,
      },
      data: {
        id: user.id.toLowerCase(),
      },
    })
    count++
  }

  console.log(`>> Lower case ${count} user ids`)
}

async function main() {
  const duplicateUserIds = await findDuplicateOrderedUsers()
  console.log('>> Found', duplicateUserIds)

  for (const userIds of duplicateUserIds) {
    await combineUsers(userIds)
  }

  await lowerCaseAllUserIds()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prismaCient.$disconnect()
  })
