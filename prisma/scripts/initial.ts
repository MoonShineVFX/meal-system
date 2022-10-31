import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.create({
    data: {
      id: '_server',
      name: '伺服器',
      role: 'SERVER',
      points: 0,
      credits: 0,
    },
  })

  await prisma.setting.create({
    data: {
      topUpValue: 500,
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
