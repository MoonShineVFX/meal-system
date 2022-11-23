import { PrismaClient, Role } from '@prisma/client'

import {
  createAccount,
  mint,
  CurrencyType,
  getUserBalance,
} from '@/lib/server/blockchain'

const prisma = new PrismaClient()

const mockData = [
  {
    id: '_server',
    name: '伺服器',
    role: Role.SERVER,
    points: 1000000,
    credits: 1000000,
  },
  {
    id: '_admin',
    name: '管理員',
    role: Role.ADMIN,
    points: 2000,
    credits: 2000,
  },
  {
    id: '_staff',
    name: '員工',
    role: Role.STAFF,
    points: 2000,
    credits: 2000,
  },
  {
    id: '_user',
    name: '使用者',
    role: Role.USER,
    points: 2000,
    credits: 2000,
  },
]

async function createBlockchainAccountWithMint(
  points: number,
  credits: number,
) {
  const newBlockchainAccount = await createAccount()
  if (points > 0) {
    await mint(CurrencyType.POINT, newBlockchainAccount.address, points)
  }
  if (credits > 0) {
    await mint(CurrencyType.CREDIT, newBlockchainAccount.address, credits)
  }
  return newBlockchainAccount
}

async function main() {
  for (const mock of mockData) {
    console.log('>> Creating user:', mock.name)

    console.log('Create prisma data')
    const updateData = {
      name: mock.name,
      role: mock.role,
      points: mock.points,
      credits: mock.credits,
    }
    const user = await prisma.user.upsert({
      where: { id: mock.id },
      update: updateData,
      create: {
        id: mock.id,
        ...updateData,
      },
      include: {
        blockchain: true,
      },
    })

    if (!user.blockchain) {
      console.log('Create bloackchain accounts')
      const newBlockchainAccount = await createBlockchainAccountWithMint(
        mock.points,
        mock.credits,
      )
      await prisma.user.update({
        where: { id: user.id },
        data: {
          blockchain: {
            create: {
              address: newBlockchainAccount.address,
              privateKey: newBlockchainAccount.privateKey,
            },
          },
        },
      })
    } else {
      console.log('Mint bloackchain accounts')
      const pointBalance = await getUserBalance(
        CurrencyType.POINT,
        user.blockchain.address,
      )
      const creditBalance = await getUserBalance(
        CurrencyType.CREDIT,
        user.blockchain.address,
      )
      if (pointBalance < mock.points) {
        await mint(
          CurrencyType.POINT,
          user.blockchain.address,
          mock.points - pointBalance,
        )
      }
      if (creditBalance < mock.credits) {
        await mint(
          CurrencyType.CREDIT,
          user.blockchain.address,
          mock.credits - creditBalance,
        )
      }
    }
  }
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
