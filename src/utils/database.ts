import { PrismaClient, Prisma } from '@prisma/client'
import { tokenCache } from './cached'
import { settings } from './settings'

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

  tokenCache.add(authToken.id, user)

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
  if (tokenCache.has(token)) return tokenCache.getUser(token)

  // If not found, find in db
  const authToken = await prisma.authToken.findUnique({
    where: { id: token },
    include: { user: { select: { id: true, name: true, role: true } } },
  })
  if (!authToken) return null

  // Cache token and purge old tokens
  tokenCache.add(authToken.id, authToken.user)

  return authToken.user
}

export async function getUserInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  return user
}

export async function rechargeCredits(
  sourceUserId: string,
  targetUserId: string,
  amount: number
) {
  // Recharge target user
  try {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { credits: { increment: amount } },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return error
    }
    throw error
  }

  // Create recharge record
  await prisma.transaction.create({
    data: {
      sourceUserId: sourceUserId,
      targetUserId: targetUserId,
      amount: amount,
      type: 'RECHARGE',
      currency: 'CREDIT',
    },
  })

  return true
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
