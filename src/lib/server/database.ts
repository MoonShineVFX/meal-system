import {
  PrismaClient,
  Role,
  TransactionType,
  Prisma,
  TwmpResultStatus,
} from '@prisma/client'

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
  forceSyncBlockchainWallet(user.id)

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
  twmpResultId?: string, // If excute from twmp update
) {
  // Add target user balance and create recharge record
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
        twmpResultId: twmpResultId,
      },
      include: {
        sourceUser: { select: { name: true } },
        targetUser: { select: { name: true } },
      },
    }),
  ])

  // Update blockchain
  updateBlockchainByMintBurn(transaction.id)

  return {
    user,
    transaction,
  }
}

export async function refundUserBalance(
  targetUserId: string,
  amount: number,
  twmpResultId?: string, // If excute from twmp update
) {
  // Burn target user balance and create refund record
  const [user, transaction] = await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: {
        creditBalance: {
          decrement: amount,
        },
      },
    }),
    prisma.transaction.create({
      data: {
        sourceUserId: settings.SERVER_USER_ID,
        targetUserId: targetUserId,
        creditAmount: -amount,
        type: TransactionType.REFUND,
        twmpResultId: twmpResultId,
      },
      include: {
        sourceUser: { select: { name: true } },
        targetUser: { select: { name: true } },
      },
    }),
  ])

  // Update blockchain
  updateBlockchainByMintBurn(transaction.id)

  return {
    user,
    transaction,
  }
}

export async function chargeUserBalance(
  userId: string,
  amount: number,
  isUsingPoint: boolean,
) {
  // Charge user and create charge record
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
  updateBlockchainByTransfer(transaction.id)

  return {
    user,
    transaction,
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
          type: { in: [TransactionType.PAYMENT] },
        },
        {
          targetUserId: userId,
          type: { in: [TransactionType.RECHARGE, TransactionType.REFUND] },
          creditAmount: { not: 0 },
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
        pointAmount: {
          gt: 0,
        },
      },
    }
  } else {
    throw new Error('Invalid role')
  }

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
}

/* TWMP */
export async function initialTwmpDeposit(amount: number, userId: string) {
  const twmpDeposit = await prisma.twmpDeposit.create({
    data: {
      userId: userId,
      transAMT: amount,
    },
  })

  return twmpDeposit
}

export async function updateTwmpDeposit(
  orderNo: string,
  txnUID: string,
  status: TwmpResultStatus,
  time: Date,
) {
  const existTwmpResult = await prisma.twmpResult.findUnique({
    where: {
      txnUID: txnUID,
    },
  })

  if (
    existTwmpResult &&
    existTwmpResult.status === status &&
    existTwmpResult.updatedAt === time
  ) {
    console.warn(`TWMP result already updated: ${txnUID}`)
    return existTwmpResult
  }

  const twmpResult = await prisma.twmpResult.upsert({
    where: {
      txnUID: txnUID,
    },
    update: {
      status: status,
      updatedAt: time,
    },
    create: {
      twmpDepositId: orderNo,
      txnUID: txnUID,
      status: status,
      createdAt: time,
      updatedAt: time,
    },
    include: {
      twmpDeposit: {
        select: {
          transAMT: true,
          userId: true,
        },
      },
    },
  })

  if (status === TwmpResultStatus.SUCCESS) {
    // Recharge user
    await rechargeUserBalance(
      twmpResult.twmpDeposit.userId,
      twmpResult.twmpDeposit.transAMT,
      CurrencyType.CREDIT,
      txnUID,
    )
  } else if (status === TwmpResultStatus.CANCELED) {
    // Refund user
    await refundUserBalance(
      twmpResult.twmpDeposit.userId,
      twmpResult.twmpDeposit.transAMT,
      txnUID,
    )
  }

  console.log(
    `TWMP Deposit [${orderNo}] Result [${txnUID}] status changed to ${status}`,
  )
}

/* Blockchain */
// Sync transaction payment by blockchain transfer
async function updateBlockchainByTransfer(transactionId: number) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      sourceUser: { include: { blockchain: true } },
      targetUser: { include: { blockchain: true } },
    },
  })

  // Catch error
  if (!transaction) throw new Error('Transaction not found')
  if (transaction.blockchainHashes.length > 0)
    throw new Error('Already updated')
  if (!transaction.sourceUser.blockchain || !transaction.targetUser.blockchain)
    throw new Error('User blockchain data not found')

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

  return await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      blockchainHashes: blockchainHashes,
    },
  })
}
// Sync transaction recharge/refund by blockchain mint/burn
async function updateBlockchainByMintBurn(transactionId: number) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      targetUser: { include: { blockchain: true } },
    },
  })

  // Catch error
  if (!transaction) throw new Error('Transaction not found')
  if (transaction.blockchainHashes.length > 0)
    throw new Error('Already updated')
  if (!transaction.targetUser.blockchain)
    throw new Error('User blockchain data not found')

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
  } else if (transaction.pointAmount < 0) {
    blockchainHashes.push(
      await blockchainManager.burn(
        CurrencyType.POINT,
        transaction.targetUser.blockchain.address,
        -transaction.pointAmount,
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
  } else if (transaction.creditAmount < 0) {
    blockchainHashes.push(
      await blockchainManager.burn(
        CurrencyType.CREDIT,
        transaction.targetUser.blockchain.address,
        -transaction.creditAmount,
      ),
    )
  }

  return await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      blockchainHashes: blockchainHashes,
    },
  })
}
// Sync user balance by blockchain mint/burn
async function forceSyncBlockchainWallet(userId: string) {
  console.log('>> Updating blockchain for user', userId)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { blockchain: true },
  })

  // Catch error
  if (!user) throw new Error('User not found')
  if (!user.blockchain) throw new Error('User blockchain data not found')

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
