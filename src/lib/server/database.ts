import {
  PrismaClient,
  UserRole,
  TransactionType,
  Prisma,
  TwmpResultStatus,
} from '@prisma/client'

import { settings, CurrencyType } from '@/lib/common'
import { blockchainManager } from './blockchain'
import { createTwmp, getTwmp } from './twmp'

function log(...args: Parameters<typeof console.log>) {
  if (settings.LOG_DATABASE) {
    console.log('[Database]', ...args)
  }
}

/* User */
export async function ensureUser(
  userId: string,
  name: string,
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
      id: userId,
      ...updateData,
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

/* Transaction */
export async function rechargeUserBalance(
  userId: string,
  amount: number,
  type: CurrencyType,
  twmpResultId?: string, // If excute from twmp update
) {
  // Add target user balance and create recharge record
  const [user, transaction] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
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
        targetUserId: userId,
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
  userId: string,
  amount: number,
  twmpResultId?: string, // If excute from twmp update
) {
  // Burn target user balance even negative and create refund record
  const [user, transaction] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        creditBalance: {
          decrement: amount,
        },
      },
    }),
    prisma.transaction.create({
      data: {
        sourceUserId: settings.SERVER_USER_ID,
        targetUserId: userId,
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

    const transaction = await client.transaction.create({
      data: {
        sourceUserId: userId,
        targetUserId: settings.SERVER_USER_ID,
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
  role: UserRole,
) {
  let whereQuery: Prisma.TransactionWhereInput
  if (role === UserRole.USER) {
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
  } else if (role === UserRole.STAFF) {
    whereQuery = {
      targetUserId: settings.SERVER_USER_ID,
      type: TransactionType.PAYMENT,
    }
  } else if (role === UserRole.ADMIN) {
    // Filter auto recharge
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
export async function createTwmpDeposit(
  userId: string,
  amount: number,
  callbackHost?: string,
) {
  let twmpDeposit = await prisma.twmpDeposit.create({
    data: {
      userId: userId,
      transAMT: amount,
    },
  })

  const response = await createTwmp(twmpDeposit.orderNo, amount, callbackHost)

  twmpDeposit = await prisma.twmpDeposit.update({
    where: { orderNo: twmpDeposit.orderNo },
    data: {
      txnID: response.txnID,
      callbackUrl: 'twmpUrl' in response ? response.twmpUrl : undefined,
      qrcode: 'qrcode' in response ? response.qrcode : undefined,
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
      depositId: orderNo,
      txnUID: txnUID,
      status: status,
      createdAt: time,
      updatedAt: time,
    },
    include: {
      deposit: {
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
      twmpResult.deposit.userId,
      twmpResult.deposit.transAMT,
      CurrencyType.CREDIT,
      txnUID,
    )
  } else if (status === TwmpResultStatus.CANCELED) {
    // Refund user
    await refundUserBalance(
      twmpResult.deposit.userId,
      twmpResult.deposit.transAMT,
      txnUID,
    )
  }

  log(
    `TWMP Deposit [${orderNo}] Result [${txnUID}] status changed to ${status}`,
  )
}

export async function getTwmpDeposit(twmpDepositId: string) {
  log(`Get TWMP Deposit [${twmpDepositId}]`)
  let twmpDeposit = await prisma.twmpDeposit.findUnique({
    where: {
      orderNo: twmpDepositId,
    },
    include: {
      results: true,
    },
  })

  if (!twmpDeposit) return null
  if (!twmpDeposit.txnID) throw new Error('TWMP txnID not found')

  if (twmpDeposit.results.length === 0) {
    log(`TWMP Deposit [${twmpDepositId}] Result not found, fetching...`)
    try {
      const response = await getTwmp(twmpDeposit.txnID)
      for (const detail of response.detail) {
        await updateTwmpDeposit(
          twmpDeposit.orderNo,
          detail.txnUID,
          detail.status,
          detail.time,
        )
      }

      twmpDeposit = await prisma.twmpDeposit.findUnique({
        where: {
          orderNo: twmpDepositId,
        },
        include: {
          results: true,
        },
      })
    } catch (error) {
      log(`TWMP Deposit [${twmpDepositId}] update failed: ${error}`)
    }
  }

  return twmpDeposit
}

/* Blockchain */
// Sync transaction payment by blockchain transfer
async function updateBlockchainByTransfer(transactionId: number) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      sourceUser: { include: { ethWallet: true } },
      targetUser: { include: { ethWallet: true } },
    },
  })

  // Catch error
  if (!transaction) throw new Error('Transaction not found')
  if (transaction.ethHashes.length > 0) throw new Error('Already updated')
  if (!transaction.sourceUser.ethWallet || !transaction.targetUser.ethWallet)
    throw new Error('User eth wallet not found')

  // Update
  let ethHashes = []
  if (transaction.pointAmount > 0) {
    ethHashes.push(
      await blockchainManager.transfer(
        CurrencyType.POINT,
        transaction.sourceUser.ethWallet.address,
        transaction.targetUser.ethWallet.address,
        transaction.pointAmount,
      ),
    )
  }
  if (transaction.creditAmount > 0) {
    ethHashes.push(
      await blockchainManager.transfer(
        CurrencyType.CREDIT,
        transaction.sourceUser.ethWallet.address,
        transaction.targetUser.ethWallet.address,
        transaction.creditAmount,
      ),
    )
  }

  return await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      ethHashes: ethHashes,
    },
  })
}
// Sync transaction recharge/refund by blockchain mint/burn
async function updateBlockchainByMintBurn(transactionId: number) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      targetUser: { include: { ethWallet: true } },
    },
  })

  // Catch error
  if (!transaction) throw new Error('Transaction not found')
  if (transaction.ethHashes.length > 0) throw new Error('Already updated')
  if (!transaction.targetUser.ethWallet)
    throw new Error('User blockchain data not found')

  // Update
  let ethHashes = []
  if (transaction.pointAmount > 0) {
    ethHashes.push(
      await blockchainManager.mint(
        CurrencyType.POINT,
        transaction.targetUser.ethWallet.address,
        transaction.pointAmount,
      ),
    )
  } else if (transaction.pointAmount < 0) {
    ethHashes.push(
      await blockchainManager.burn(
        CurrencyType.POINT,
        transaction.targetUser.ethWallet.address,
        -transaction.pointAmount,
      ),
    )
  }
  if (transaction.creditAmount > 0) {
    ethHashes.push(
      await blockchainManager.mint(
        CurrencyType.CREDIT,
        transaction.targetUser.ethWallet.address,
        transaction.creditAmount,
      ),
    )
  } else if (transaction.creditAmount < 0) {
    ethHashes.push(
      await blockchainManager.burn(
        CurrencyType.CREDIT,
        transaction.targetUser.ethWallet.address,
        -transaction.creditAmount,
      ),
    )
  }

  return await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      ethHashes: ethHashes,
    },
  })
}
// Sync user balance by blockchain mint/burn
async function forceSyncBlockchainWallet(userId: string) {
  log('>> Updating blockchain for user', userId)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { ethWallet: true },
  })

  // Catch error
  if (!user) throw new Error('User not found')
  if (!user.ethWallet) throw new Error('User blockchain data not found')

  // Update
  const pointBalance = await blockchainManager.getUserBalance(
    CurrencyType.POINT,
    user.ethWallet.address,
  )
  const creditBalance = await blockchainManager.getUserBalance(
    CurrencyType.CREDIT,
    user.ethWallet.address,
  )
  log('Blockchain balance', pointBalance, creditBalance)
  log('Database balance', user.pointBalance, user.creditBalance)
  if (pointBalance < user.pointBalance) {
    log('Minting point for user', user.name)
    const hash = await blockchainManager.mint(
      CurrencyType.POINT,
      user.ethWallet.address,
      user.pointBalance - pointBalance,
    )
    log(hash)
  } else if (pointBalance > user.pointBalance) {
    log('Burning point for user', user.name)
    const hash = await blockchainManager.burn(
      CurrencyType.POINT,
      user.ethWallet.address,
      pointBalance - user.pointBalance,
    )
    log(hash)
  }
  if (creditBalance < user.creditBalance) {
    log('Minting credit for user', user.name)
    const hash = await blockchainManager.mint(
      CurrencyType.CREDIT,
      user.ethWallet.address,
      user.creditBalance - creditBalance,
    )
    log(hash)
  } else if (creditBalance > user.creditBalance) {
    log('Burning credit for user', user.name)
    const hash = await blockchainManager.burn(
      CurrencyType.CREDIT,
      user.ethWallet.address,
      creditBalance - user.creditBalance,
    )
    log(hash)
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
