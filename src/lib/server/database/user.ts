import { UserRole } from '@prisma/client'
import CryptoJS from 'crypto-js'

import { prisma, log } from './define'
import { settings } from '@/lib/common'
import { blockchainManager } from '@/lib/server/blockchain'
import { forceSyncBlockchainWallet } from './blockchain'

type EnsureUserArgs = {
  userId: string
  name?: string
  password?: string
  role?: UserRole
  pointBalance?: number
  creditBalance?: number
}
export async function ensureUser({
  userId,
  name,
  password,
  role,
  pointBalance,
  creditBalance,
}: EnsureUserArgs) {
  const updateData = {
    name: name,
    role: role,
    pointBalance: pointBalance,
    creditBalance: creditBalance,
    password: password ? CryptoJS.SHA256(password).toString() : undefined,
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
}

export async function createUserToken(userId: string) {
  const userToken = await prisma.userToken.create({
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

  const { tokens: userTokens } = userToken.user

  // Limit tokens per user
  if (userTokens.length > settings.TOKEN_COUNT_PER_USER) {
    const toDeleteTokenIds = userTokens
      .slice(0, userTokens.length - settings.TOKEN_COUNT_PER_USER)
      .map((t) => t.id)
    await prisma.userToken.deleteMany({
      where: {
        id: { in: toDeleteTokenIds },
      },
    })
  }

  return userToken.id
}

export async function validateUserPassword(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  })

  if (user && user.password === CryptoJS.SHA256(password).toString()) {
    return true
  }

  return false
}

export async function getUserLite({ token }: { token: string }) {
  const userToken = await prisma.userToken.findUnique({
    where: { id: token },
    include: { user: { select: { id: true, name: true, role: true } } },
  })
  if (!userToken) return null

  return userToken.user
}

export async function getUserInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      pointBalance: true,
      creditBalance: true,
      profileImage: {
        select: {
          path: true,
        },
      },
    },
  })
  return user
}
