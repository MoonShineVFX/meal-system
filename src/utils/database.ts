import {
  PrismaClient,
  Role,
  TransactionType,
  CurrencyType,
  Prisma,
} from '@prisma/client'
import { tokenCache } from './cached'
import { settings } from './settings'
import { eventsCentral } from './event'

/* Functions */
export async function ensureUser(userId: string, name: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  })
  if (user) return user

  const newUser = await prisma.user.create({
    data: {
      id: userId,
      name: name,
    },
  })
  return newUser
}

export async function createAuthToken(userId: string) {
  const authToken = await prisma.authToken.create({
    data: {
      userId: userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          authTokens: true,
        },
      },
    },
  })

  const { authTokens: userAuthTokens, ...user } = authToken.user

  await tokenCache.add(authToken.id, user)

  // Limit tokens per user
  if (userAuthTokens.length > settings.TOKEN_COUNT_PER_USER) {
    const toDeleteTokenIds = userAuthTokens
      .slice(0, userAuthTokens.length - settings.TOKEN_COUNT_PER_USER)
      .map((t) => t.id)
    await prisma.authToken.deleteMany({
      where: {
        id: { in: toDeleteTokenIds },
      },
    })
  }

  return authToken.id
}

export async function validateAuthToken(token: string) {
  // Find cached tokens first
  if (await tokenCache.has(token)) return await tokenCache.getUser(token)

  // If not found, find in db
  const authToken = await prisma.authToken.findUnique({
    where: { id: token },
    include: { user: { select: { id: true, name: true, role: true } } },
  })
  if (!authToken) return null

  // Cache token and purge old tokens
  await tokenCache.add(authToken.id, authToken.user)

  return authToken.user
}

export async function getUserInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  return user
}

export async function rechargeUserCredits(
  sourceUserId: string,
  targetUserId: string,
  amount: number,
) {
  // Recharge target user and create recharge record
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: targetUserId },
        data: { credits: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          sourceUserId: sourceUserId,
          targetUserId: targetUserId,
          amount: amount,
          type: TransactionType.RECHARGE,
          currency: CurrencyType.CREDIT,
        },
      }),
    ])
  } catch (error) {
    return error
  }

  // Create recharge record
  eventsCentral.add({
    sourceUserId: sourceUserId,
    targetUserId: targetUserId,
    type: TransactionType.RECHARGE,
  })

  return true
}

export async function chargeUserBalance(
  userId: string,
  amount: number,
  currency: CurrencyType,
) {
  // Check user has enough balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  if (!user) return Error('User not found')

  if (currency === CurrencyType.CREDIT) {
    if (user.credits < amount) return Error('Insufficient credits')
  } else if (currency === CurrencyType.POINT) {
    if (user.points < amount) return Error('Insufficient points')
  } else {
    return Error('Invalid currency')
  }

  // Charge user and create charge record
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: currency === CurrencyType.CREDIT ? amount : 0 },
          points: { decrement: currency === CurrencyType.POINT ? amount : 0 },
        },
      }),
      prisma.user.update({
        where: { id: settings.SERVER_USER_ID },
        data: {
          credits: {
            increment: currency === CurrencyType.CREDIT ? amount : 0,
          },
          points: { increment: currency === CurrencyType.POINT ? amount : 0 },
        },
      }),
      prisma.transaction.create({
        data: {
          sourceUserId: userId,
          targetUserId: settings.SERVER_USER_ID,
          amount: amount,
          type: TransactionType.PAYMENT,
          currency: currency,
        },
      }),
    ])
  } catch (error) {
    return error
  }

  // Add event
  eventsCentral.add({
    sourceUserId: userId,
    targetUserId: settings.SERVER_USER_ID,
    type: TransactionType.PAYMENT,
  })

  return true
}

export async function getTransactions(
  userId: string | undefined,
  cursor: number | undefined,
  until: number | undefined,
  role: Role,
) {
  let whereQuery: Prisma.TransactionWhereInput
  if (role === Role.USER) {
    whereQuery = {
      OR: [
        {
          sourceUserId: userId,
          type: { in: [TransactionType.PAYMENT, TransactionType.RESERVE] },
        },
        {
          targetUserId: userId,
          type: { in: [TransactionType.RECHARGE, TransactionType.REFUND] },
        },
      ],
    }
  } else if (role === Role.STAFF) {
    whereQuery = {
      targetUserId: settings.SERVER_USER_ID,
      type: TransactionType.PAYMENT,
    }
  } else if (role === Role.ADMIN || role === Role.SERVER) {
    whereQuery = {
      NOT: {
        sourceUserId: settings.SERVER_USER_ID,
        type: TransactionType.RECHARGE,
      },
    }
  } else {
    throw Error('Invalid role')
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      AND: [
        whereQuery,
        {
          id: until ? { gt: until } : undefined,
        },
      ],
    },
    orderBy: {
      id: 'desc',
    },
    include: {
      sourceUser: {
        select: {
          name: true,
        },
      },
      targetUser: {
        select: {
          name: true,
        },
      },
    },
    take: settings.RECORDS_PER_PAGE + 1,
    cursor: cursor ? { id: cursor } : undefined,
  })
  return transactions
}

/* Global */
declare global {
  var prisma: PrismaClient | undefined
}

const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV !== 'production'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
