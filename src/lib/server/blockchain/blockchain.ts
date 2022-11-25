import Web3 from 'web3'
import { AbiItem } from 'web3-utils'
import { SignedTransaction, Account } from 'web3-core'
import { Contract } from 'web3-eth-contract'

import abi from './abi.json'
import { settings, CurrencyType } from '@/lib/common'

/* Type */
type NonceMetadata = { nonce: number; time: number }

/* Defines */
class BlockchainManager {
  private client: Web3
  private adminAccount: Account
  private contracts: {
    [CurrencyType.CREDIT]: Contract
    [CurrencyType.POINT]: Contract
  }

  private nonceQueue: Promise<NonceMetadata>[] = []

  private gasPrice = Web3.utils.toWei(
    settings.BLOCKCHAIN_GAS_PRICE.toString(),
    'gwei',
  )

  constructor() {
    this.client = new Web3(settings.BLOCKCHAIN_URL)
    this.contracts = {
      [CurrencyType.CREDIT]: new this.client.eth.Contract(
        abi as AbiItem[],
        settings.BLOCKCHAIN_CREDIT_ADDRESS,
      ),
      [CurrencyType.POINT]: new this.client.eth.Contract(
        abi as AbiItem[],
        settings.BLOCKCHAIN_POINT_ADDRESS,
      ),
    }
    this.adminAccount = this.client.eth.accounts.privateKeyToAccount(
      settings.BLOCKCHAIN_PRIVATE_KEY,
    )
    this.getNonce()
  }

  log(...args: Parameters<typeof console.log>) {
    if (settings.LOG_BLOCKCHAIN) {
      console.log('[Blockchain Manager]', ...args)
    }
  }

  async getNonce() {
    this.log('>> Get Nonce')

    const previousPromise =
      this.nonceQueue.length > 0
        ? this.nonceQueue[this.nonceQueue.length - 1]
        : null
    let currentPromise: Promise<NonceMetadata>

    if (!previousPromise) {
      this.log('No previous promise, create mock one')
      currentPromise = new Promise<NonceMetadata>(async (resolve) => {
        resolve({ nonce: -1, time: 0 })
      })
    } else {
      this.log('Previous promise exists')
      currentPromise = new Promise<NonceMetadata>(async (resolve) => {
        const previousNonceMetadata = await previousPromise
        const now = Date.now()
        if (
          now - previousNonceMetadata.time >
          settings.BLOCKCHAIN_NONCE_REFRESH_TIME
        ) {
          this.log('Previous nonce is too old, refresh new one')
          const newNonce = await this.client.eth.getTransactionCount(
            this.adminAccount.address,
          )
          resolve({ nonce: newNonce, time: now })
        } else {
          this.log(
            'Previous nonce is still valid, increase it',
            previousNonceMetadata.nonce + 1,
          )
          resolve({
            nonce: previousNonceMetadata.nonce + 1,
            time: previousNonceMetadata.time,
          })
        }
      })
    }

    this.nonceQueue.push(currentPromise)
    if (this.nonceQueue.length > 3) this.nonceQueue.shift()

    const thisNonce = await currentPromise
    this.log('<< Nonce', thisNonce.nonce)

    return thisNonce.nonce
  }

  /* Functions */
  waitForTxHash(singedTx: SignedTransaction): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.eth
        .sendSignedTransaction(singedTx.rawTransaction!)
        .on('transactionHash', (hash) => {
          resolve(hash)
        })
        .on('error', (err) => {
          reject(err)
        })
    })
  }

  async transfer(
    currencyType: CurrencyType,
    fromAddress: string,
    toAddress: string,
    amount: number,
  ) {
    const thisNonce = await this.getNonce()
    const signedTx = await this.client.eth.accounts.signTransaction(
      {
        from: this.adminAccount.address,
        to:
          currencyType === CurrencyType.CREDIT
            ? settings.BLOCKCHAIN_CREDIT_ADDRESS
            : settings.BLOCKCHAIN_POINT_ADDRESS,
        value: Web3.utils.toWei('0', 'ether'),
        gasPrice: this.gasPrice,
        gas: settings.BLOCKCHAIN_GAS,
        nonce: thisNonce,
        data: this.contracts[currencyType].methods
          .transferFrom(
            Web3.utils.toChecksumAddress(fromAddress),
            Web3.utils.toChecksumAddress(toAddress),
            Web3.utils.toWei(amount.toString(), 'ether'),
          )
          .encodeABI(),
      },
      settings.BLOCKCHAIN_PRIVATE_KEY,
    )

    if (!signedTx.rawTransaction) {
      throw new Error('Failed to sign transaction')
    }

    return this.waitForTxHash(signedTx)
  }

  async mint(currencyType: CurrencyType, toAddress: string, amount: number) {
    const thisNonce = await this.getNonce()
    const signedTx = await this.client.eth.accounts.signTransaction(
      {
        from: this.adminAccount.address,
        to:
          currencyType === CurrencyType.CREDIT
            ? settings.BLOCKCHAIN_CREDIT_ADDRESS
            : settings.BLOCKCHAIN_POINT_ADDRESS,
        value: Web3.utils.toWei('0', 'ether'),
        gasPrice: this.gasPrice,
        gas: settings.BLOCKCHAIN_GAS,
        nonce: thisNonce,
        data: this.contracts[currencyType].methods
          .mint(
            Web3.utils.toChecksumAddress(toAddress),
            Web3.utils.toWei(amount.toString(), 'ether'),
          )
          .encodeABI(),
      },
      settings.BLOCKCHAIN_PRIVATE_KEY,
    )

    if (!signedTx.rawTransaction) {
      throw new Error('Failed to sign transaction')
    }

    return this.waitForTxHash(signedTx)
  }

  async burn(currencyType: CurrencyType, fromAddress: string, amount: number) {
    const thisNonce = await this.getNonce()
    const signedTx = await this.client.eth.accounts.signTransaction(
      {
        from: this.adminAccount.address,
        to:
          currencyType === CurrencyType.CREDIT
            ? settings.BLOCKCHAIN_CREDIT_ADDRESS
            : settings.BLOCKCHAIN_POINT_ADDRESS,
        value: Web3.utils.toWei('0', 'ether'),
        gasPrice: this.gasPrice,
        gas: settings.BLOCKCHAIN_GAS,
        nonce: thisNonce,
        data: this.contracts[currencyType].methods
          .burn(
            Web3.utils.toChecksumAddress(fromAddress),
            Web3.utils.toWei(amount.toString(), 'ether'),
          )
          .encodeABI(),
      },
      settings.BLOCKCHAIN_PRIVATE_KEY,
    )

    if (!signedTx.rawTransaction) {
      throw new Error('Failed to sign transaction')
    }

    return this.waitForTxHash(signedTx)
  }

  async createAccount() {
    return this.client.eth.accounts.create()
  }

  async getUserBalance(currencyType: CurrencyType, address: string) {
    const balance = await this.contracts[currencyType].methods
      .balanceOf(Web3.utils.toChecksumAddress(address))
      .call()
    return parseInt(Web3.utils.fromWei(balance.toString(), 'ether'), 10)
  }
}

/* Global */
declare global {
  var blockchainManager: BlockchainManager | undefined
}

export const blockchainManager =
  global.blockchainManager ?? new BlockchainManager()

if (process.env.NODE_ENV !== 'production') {
  global.blockchainManager = blockchainManager
}
