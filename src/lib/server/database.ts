import { PrismaClient, Role, TransactionType, Prisma } from '@prisma/client'

import { settings, CurrencyType } from '@/lib/common'
import { blockchainManager } from './blockchain'

/* User */
export async function ensureUser(
  userId: string,
  name: string,
  role?: Role,
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
export async function rechargeUserBalance(
  targetUserId: string,
  amount: number,
  type: CurrencyType,
) {
  // Recharge target user and create recharge record
  try {
    const [user, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: targetUserId },
        data: {
          creditBalance: {
            increment: type === CurrencyType.CREDIT ? amount : 0,
          },
          pointBalance: {
            increment: type === CurrencyType.POINT ? amount : 0,
          },
        },
      }),
      prisma.transaction.create({
        data: {
          sourceUserId: settings.SERVER_USER_ID,
          targetUserId: targetUserId,
          creditAmount: amount,
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
      let pointAmountToPay = 0
      let creditAmountToPay = 0

      if (isUsingPoint) {
        pointAmountToPay = Math.min(amount, user.pointBalance)
        creditAmountToPay = amount - pointAmountToPay
      } else {
        creditAmountToPay = amount
      }

      if (creditAmountToPay > user.creditBalance)
        throw new Error('Not enough credits')

      /* Operation */
      // Charge user
      const updatedUser = await client.user.update({
        where: {
          id: userId,
        },
        data: {
          creditBalance: { decrement: creditAmountToPay },
          pointBalance: { decrement: pointAmountToPay },
        },
      })

      // Recharge server
      await client.user.update({
        where: { id: settings.SERVER_USER_ID },
        data: {
          creditBalance: {
            increment: creditAmountToPay,
          },
          pointBalance: { increment: pointAmountToPay },
        },
      })

      const transaction = await client.transaction.create({
        data: {
          sourceUserId: userId,
          targetUserId: settings.SERVER_USER_ID,
          creditAmount: creditAmountToPay,
          pointAmount: pointAmountToPay,
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
  if (transaction.pointAmount > 0) {
    blockchainHashes.push(
      await blockchainManager.transfer(
        CurrencyType.POINT,
        transaction.sourceUser.blockchain.address,
        transaction.targetUser.blockchain.address,
        transaction.pointAmount,
      ),
    )
  }
  if (transaction.creditAmount > 0) {
    blockchainHashes.push(
      await blockchainManager.transfer(
        CurrencyType.CREDIT,
        transaction.sourceUser.blockchain.address,
        transaction.targetUser.blockchain.address,
        transaction.creditAmount,
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
  if (transaction.pointAmount > 0) {
    blockchainHashes.push(
      await blockchainManager.mint(
        CurrencyType.POINT,
        transaction.targetUser.blockchain.address,
        transaction.pointAmount,
      ),
    )
  }
  if (transaction.creditAmount > 0) {
    blockchainHashes.push(
      await blockchainManager.mint(
        CurrencyType.CREDIT,
        transaction.targetUser.blockchain.address,
        transaction.creditAmount,
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
  console.log('Database balance', user.pointBalance, user.creditBalance)
  if (pointBalance < user.pointBalance) {
    console.log('Minting point for user', user.name)
    const hash = await blockchainManager.mint(
      CurrencyType.POINT,
      user.blockchain.address,
      user.pointBalance - pointBalance,
    )
    console.log(hash)
  } else if (pointBalance > user.pointBalance) {
    console.log('Burning point for user', user.name)
    const hash = await blockchainManager.burn(
      CurrencyType.POINT,
      user.blockchain.address,
      pointBalance - user.pointBalance,
    )
    console.log(hash)
  }
  if (creditBalance < user.creditBalance) {
    console.log('Minting credit for user', user.name)
    const hash = await blockchainManager.mint(
      CurrencyType.CREDIT,
      user.blockchain.address,
      user.creditBalance - creditBalance,
    )
    console.log(hash)
  } else if (creditBalance > user.creditBalance) {
    console.log('Burning credit for user', user.name)
    const hash = await blockchainManager.burn(
      CurrencyType.CREDIT,
      user.blockchain.address,
      creditBalance - user.creditBalance,
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
