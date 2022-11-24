import { PrismaClient, Role, TransactionType, Prisma } from '@prisma/client'

import { settings } from '@/lib/common'
import { blockchainManager, CurrencyType } from './blockchain'

/* User */
export async function ensureUser(
  userId: string,
  name: string,
  role?: Role,
  points?: number,
  credits?: number,
) {
  const updateData = {
    name: name,
    role: role,
    points: points,
    credits: credits,
  }

  const user = await prisma.user.upsert({
    where: {
      id: userId,
    },
    update: updateData,
    create: {
      id: userId,
      ...updateData,
    },
    include: {
      blockchain: true,
    },
  })

  // If user does not have a blockchain, create one
  if (!user.blockchain) {
    console.log(`Creating blockchain account for user ${user.name} (${userId})`)
    const newBlockchainAccount = await blockchainManager.createAccount()
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        blockchain: {
          create: {
            address: newBlockchainAccount.address,
            privateKey: newBlockchainAccount.privateKey,
          },
        },
      },
    })
  }
  blockchainUpdateForUser(user.id)

  return user
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

  const { authTokens: userAuthTokens } = authToken.user

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
  const authToken = await prisma.authToken.findUnique({
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

/* Transaction */
export async function rechargeUserCredits(
  sourceUserId: string,
  targetUserId: string,
  amount: number,
) {
  // Recharge target user and create recharge record
  try {
    const [user, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: targetUserId },
        data: { credits: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          sourceUserId: sourceUserId,
          targetUserId: targetUserId,
          creditsAmount: amount,
          type: TransactionType.RECHARGE,
        },
        include: {
          sourceUser: { select: { name: true } },
          targetUser: { select: { name: true } },
        },
      }),
    ])

    // Update blockchain
    blockchainUpdateFromRecharge(transaction.id)

    return {
      user,
      transaction,
    }
  } catch (error) {
    if (error instanceof Error) return error
    return new Error('Unknown error')
  }
}

export async function chargeUserBalance(
  userId: string,
  amount: number,
  isUsingPoint: boolean,
) {
  // Charge user and create charge record
  try {
    const [user, transaction] = await prisma.$transaction(async (client) => {
      /* Validate */
      // Check user has enough balance
      const user = await client.user.findUnique({
        where: { id: userId },
      })
      if (!user) throw new Error('User not found')

      // Calculate charge amount
      let pointsChargeAmount = 0
      let creditsChargeAmount = 0

      if (isUsingPoint) {
        pointsChargeAmount = Math.min(amount, user.points)
        creditsChargeAmount = amount - pointsChargeAmount
      } else {
        creditsChargeAmount = amount
      }

      if (creditsChargeAmount > user.credits)
        throw new Error('Not enough credits')

      /* Operation */
      // Charge user
      const updatedUser = await client.user.update({
        where: {
          id: userId,
        },
        data: {
          credits: { decrement: creditsChargeAmount },
          points: { decrement: pointsChargeAmount },
        },
      })

      // Recharge server
      await client.user.update({
        where: { id: settings.SERVER_USER_ID },
        data: {
          credits: {
            increment: creditsChargeAmount,
          },
          points: { increment: pointsChargeAmount },
        },
      })

      const transaction = await client.transaction.create({
        data: {
          sourceUserId: userId,
          targetUserId: settings.SERVER_USER_ID,
          creditsAmount: creditsChargeAmount,
          pointsAmount: pointsChargeAmount,
          type: TransactionType.PAYMENT,
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
      })

      return [updatedUser, transaction]
    })

    // Update blockchain
    blockchainUpdateFromTransfer(transaction.id)

    return {
      user,
      transaction,
    }
  } catch (error) {
    if (error instanceof Error) return error
    return Error('Unknown error')
  }
}

export async function getTransactions(
  userId: string | undefined,
  cursor: number | undefined,
  role: Role,
) {
  let whereQuery: Prisma.TransactionWhereInput
  if (role === Role.USER) {
    whereQuery = {
      OR: [
        {
          sourceUserId: userId,
          type: { in: [TransactionType.PAYMENT, TransactionType.ORDER] },
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
    return Error('Invalid role')
  }
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        AND: [whereQuery],
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
      take: settings.TRANSACTIONS_PER_PAGE + 1,
      cursor: cursor ? { id: cursor } : undefined,
    })
    return transactions
  } catch (error) {
    if (error instanceof Error) return error
    return Error('Unknown error')
  }
}

/* TWMP */
export async function initialTwmpPayment(amount: number, userId: string) {
  const twmp = await prisma.twmp.create({
    data: {
      transAMT: amount,
      userId: userId,
    },
  })

  return twmp
}

/* Blockchain */
async function blockchainUpdateFromTransfer(transactionId: number) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      sourceUser: { include: { blockchain: true } },
      targetUser: { include: { blockchain: true } },
    },
  })

  // Catch error
  if (!transaction) throw Error('Transaction not found')
  if (transaction.blockchainHashes.length > 0) throw Error('Already updated')
  if (!transaction.sourceUser.blockchain || !transaction.targetUser.blockchain)
    throw Error('User blockchain data not found')

  // Update
  let blockchainHashes = []
  if (transaction.pointsAmount > 0) {
    blockchainHashes.push(
      await blockchainManager.transfer(
        CurrencyType.POINT,
        transaction.sourceUser.blockchain.address,
        transaction.targetUser.blockchain.address,
        transaction.pointsAmount,
      ),
    )
  }
  if (transaction.creditsAmount > 0) {
    blockchainHashes.push(
      await blockchainManager.transfer(
        CurrencyType.CREDIT,
        transaction.sourceUser.blockchain.address,
        transaction.targetUser.blockchain.address,
        transaction.creditsAmount,
      ),
    )
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      blockchainHashes: blockchainHashes,
    },
  })
}

async function blockchainUpdateFromRecharge(transactionId: number) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      targetUser: { include: { blockchain: true } },
    },
  })

  // Catch error
  if (!transaction) throw Error('Transaction not found')
  if (transaction.blockchainHashes.length > 0) throw Error('Already updated')
  if (!transaction.targetUser.blockchain)
    throw Error('User blockchain data not found')

  // Update
  let blockchainHashes = []
  if (transaction.pointsAmount > 0) {
    blockchainHashes.push(
      await blockchainManager.mint(
        CurrencyType.POINT,
        transaction.targetUser.blockchain.address,
        transaction.pointsAmount,
      ),
    )
  }
  if (transaction.creditsAmount > 0) {
    blockchainHashes.push(
      await blockchainManager.mint(
        CurrencyType.CREDIT,
        transaction.targetUser.blockchain.address,
        transaction.creditsAmount,
      ),
    )
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      blockchainHashes: blockchainHashes,
    },
  })
}

async function blockchainUpdateForUser(userId: string) {
  console.log('>> Updating blockchain for user', userId)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { blockchain: true },
  })

  // Catch error
  if (!user) throw Error('User not found')
  if (!user.blockchain) throw Error('User blockchain data not found')

  // Update
  const pointBalance = await blockchainManager.getUserBalance(
    CurrencyType.POINT,
    user.blockchain.address,
  )
  const creditBalance = await blockchainManager.getUserBalance(
    CurrencyType.CREDIT,
    user.blockchain.address,
  )
  console.log('Blockchain balance', pointBalance, creditBalance)
  console.log('Database balance', user.points, user.credits)
  if (pointBalance < user.points) {
    console.log('Minting points for user', user.name)
    const hash = await blockchainManager.mint(
      CurrencyType.POINT,
      user.blockchain.address,
      user.points - pointBalance,
    )
    console.log(hash)
  } else if (pointBalance > user.points) {
    console.log('Burning points for user', user.name)
    const hash = await blockchainManager.burn(
      CurrencyType.POINT,
      user.blockchain.address,
      pointBalance - user.points,
    )
    console.log(hash)
  }
  if (creditBalance < user.credits) {
    console.log('Minting credits for user', user.name)
    const hash = await blockchainManager.mint(
      CurrencyType.CREDIT,
      user.blockchain.address,
      user.credits - creditBalance,
    )
    console.log(hash)
  } else if (creditBalance > user.credits) {
    console.log('Burning credits for user', user.name)
    const hash = await blockchainManager.burn(
      CurrencyType.CREDIT,
      user.blockchain.address,
      creditBalance - user.credits,
    )
    console.log(hash)
  }
}

/* Global */
declare global {
  var prisma: PrismaClient | undefined
}

const prisma =
  global.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV !== 'production'
        ? ['error', 'warn'] // ['query'] if wanted
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
