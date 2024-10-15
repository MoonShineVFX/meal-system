import { prismaCient } from '../../../src/lib/server/database'

async function main() {
  const statistics = await prismaCient.transaction.groupBy({
    by: ['targetUserId'],
    where: {
      type: 'RECHARGE',
      createdAt: {
        gte: new Date('2023-11-01T00:00:00.000+08:00'),
      },
    },
    _sum: {
      pointAmount: true,
    },
    orderBy: {
      _sum: {
        pointAmount: 'desc',
      },
    },
  })

  console.log(statistics)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prismaCient.$disconnect()
  })
