import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.createMany({
    data: [
      {
        id: '_server',
        name: '伺服器',
        role: Role.SERVER,
        points: 0,
        credits: 0,
      },
      {
        id: '_admin',
        name: '管理員',
        role: Role.ADMIN,
        points: 0,
        credits: 0,
      },
      {
        id: '_staff',
        name: '員工',
        role: Role.STAFF,
        points: 0,
        credits: 0,
      },
      {
        id: '_user',
        name: '使用者',
        role: Role.USER,
        points: 0,
        credits: 0,
      },
    ],
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
