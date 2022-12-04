import { UserRole } from '@prisma/client'

import { prisma, log } from './define'
import { settings } from '@/lib/common'
import { blockchainManager } from '@/lib/server/blockchain'
import { forceSyncBlockchainWallet } from './blockchain'

export async function ensureUser(
  userId: string,
  name?: string,
  role?: UserRole,
  pointBalance?: number,
  creditBalance?: number,
) {
  const updateData = {
    name: name,
    role: role,
    pointBalance: pointBalance,
    creditBalance: creditBalance,
  }

  const user = await prisma.user.upsert({
    where: {
      id: userId,
    },
    update: updateData,
    create: {
      ...updateData,
      id: userId,
      name: name ?? userId,
    },
    include: {
      ethWallet: true,
    },
  })

  // If user does not have a blockchain, create one
  if (!user.ethWallet) {
    log(`Creating blockchain account for user ${user.name} (${userId})`)
    const newBlockchainAccount = await blockchainManager.createAccount()
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ethWallet: {
          create: {
            address: newBlockchainAccount.address,
            privateKey: newBlockchainAccount.privateKey,
          },
        },
      },
    })
  }
  forceSyncBlockchainWallet(user.id)

  return user
}

export async function createAuthToken(userId: string) {
  const authToken = await prisma.userToken.create({
    data: {
      userId: userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          tokens: true,
        },
      },
    },
  })

  const { tokens: userAuthTokens } = authToken.user

  // Limit tokens per user
  if (userAuthTokens.length > settings.TOKEN_COUNT_PER_USER) {
    const toDeleteTokenIds = userAuthTokens
      .slice(0, userAuthTokens.length - settings.TOKEN_COUNT_PER_USER)
      .map((t) => t.id)
    await prisma.userToken.deleteMany({
      where: {
        id: { in: toDeleteTokenIds },
      },
    })
  }

  return authToken.id
}

export async function validateAuthToken(token: string) {
  const authToken = await prisma.userToken.findUnique({
    where: { id: token },
    include: { user: { select: { id: true, name: true, role: true } } },
  })
  if (!authToken) return null

  return authToken.user
}

export async function getUserInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  return user
}
