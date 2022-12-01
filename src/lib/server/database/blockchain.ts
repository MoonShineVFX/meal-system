import { CurrencyType } from '@/lib/common'
import { prisma, log } from './define'
import { blockchainManager } from '@/lib/server/blockchain'

// Sync transaction payment by blockchain transfer
export async function updateBlockchainByTransfer(transactionId: number) {
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
export async function updateBlockchainByMintBurn(transactionId: number) {
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
export async function forceSyncBlockchainWallet(userId: string) {
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
