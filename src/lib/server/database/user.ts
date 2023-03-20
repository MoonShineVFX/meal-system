import { UserRole, Transaction } from '@prisma/client'
import CryptoJS from 'crypto-js'

import { prisma, log } from './define'
import { settings } from '@/lib/common'
import { blockchainManager } from '@/lib/server/blockchain'
import { forceSyncBlockchainWallet } from './blockchain'
import { rechargeUserBalanceBase } from './transaction'

type EnsureUserArgs = {
  userId: string
  name?: string
  password?: string
  role?: UserRole
  pointBalance?: number
  creditBalance?: number
  email?: string
}
export async function ensureUser({
  userId,
  name,
  password,
  role,
  pointBalance,
  creditBalance,
  email,
}: EnsureUserArgs) {
  const updateData = {
    name: name,
    role: role,
    pointBalance: pointBalance,
    creditBalance: creditBalance,
    password: password ? CryptoJS.SHA256(password).toString() : undefined,
    email: email,
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
  const result = await prisma.$transaction(async (client) => {
    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        pointBalance: true,
        creditBalance: true,
        lastPointRechargeTime: true,
        profileImage: {
          select: {
            path: true,
          },
        },
      },
    })

    if (!user) return null

    // Check if user needs to recharge points
    let isRecharged = false
    let thisCallback: (() => Promise<Transaction>) | undefined = undefined
    const now = new Date()
    const lastRechargeTime = user.lastPointRechargeTime ?? new Date(0)
    if (now.toLocaleDateString() !== lastRechargeTime.toLocaleDateString()) {
      // Recharge points
      if (user.pointBalance < settings.POINT_DAILY_RECHARGE_AMOUNT) {
        const { callback } = await rechargeUserBalanceBase({
          userId: user.id,
          pointAmount: settings.POINT_DAILY_RECHARGE_AMOUNT - user.pointBalance,
          client,
        })
        thisCallback = callback

        user.pointBalance = settings.POINT_DAILY_RECHARGE_AMOUNT
        isRecharged = true
      }

      // Update last recharge time
      await client.user.update({
        where: { id: user.id },
        data: {
          lastPointRechargeTime: now,
        },
      })
    }

    const { lastPointRechargeTime, ...resultUser } = user
    return { user: resultUser, isRecharged, callback: thisCallback }
  })

  if (result === null) return null

  const { user, isRecharged, callback } = result
  if (callback) callback()

  return { user, isRecharged }
}
