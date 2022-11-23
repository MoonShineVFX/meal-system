import Web3 from 'web3'
import { AbiItem } from 'web3-utils'

import abi from './abi.json'
import { settings } from '@/lib/common'

/* Type */
export enum CurrencyType {
  CREDIT = 'credit',
  POINT = 'point',
}

/* Defines */
const web3 = new Web3(settings.BLOCKCHAIN_URL)
const gasPrice = web3.utils.toWei(
  settings.BLOCKCHAIN_GAS_PRICE.toString(),
  'gwei',
)
const gas = settings.BLOCKCHAIN_GAS
const contracts = {
  [CurrencyType.CREDIT]: new web3.eth.Contract(
    abi as AbiItem[],
    settings.BLOCKCHAIN_CREDIT_ADDRESS,
  ),
  [CurrencyType.POINT]: new web3.eth.Contract(
    abi as AbiItem[],
    settings.BLOCKCHAIN_POINT_ADDRESS,
  ),
}
const adminAccount = web3.eth.accounts.privateKeyToAccount(
  settings.BLOCKCHAIN_PRIVATE_KEY,
)
const adminAddress = adminAccount.address

/* Functions */
export async function transfer(
  currencyType: CurrencyType,
  fromAddress: string,
  toAddress: string,
  amount: number,
) {
  const nonce = (await web3.eth.getTransactionCount(adminAddress)) + 1
  const signedTx = await web3.eth.accounts.signTransaction(
    {
      from: adminAddress,
      value: web3.utils.toWei('0', 'ether'),
      gasPrice,
      gas,
      nonce,
      data: contracts[currencyType].methods
        .transferFrom(
          web3.utils.toChecksumAddress(fromAddress),
          web3.utils.toChecksumAddress(toAddress),
          amount,
        )
        .encodeABI(),
    },
    settings.BLOCKCHAIN_PRIVATE_KEY,
  )

  if (!signedTx.rawTransaction) {
    throw new Error('Failed to sign transaction')
  }

  const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
  return receipt.transactionHash
}

export async function mint(
  currencyType: CurrencyType,
  toAddress: string,
  amount: number,
) {
  const nonce = (await web3.eth.getTransactionCount(adminAddress)) + 1
  const signedTx = await web3.eth.accounts.signTransaction(
    {
      from: adminAddress,
      value: web3.utils.toWei('0', 'ether'),
      gasPrice,
      gas,
      nonce,
      data: contracts[currencyType].methods
        .mint(web3.utils.toChecksumAddress(toAddress), amount)
        .encodeABI(),
    },
    settings.BLOCKCHAIN_PRIVATE_KEY,
  )

  if (!signedTx.rawTransaction) {
    throw new Error('Failed to sign transaction')
  }

  const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
  return receipt.transactionHash
}

export async function burn(
  currencyType: CurrencyType,
  fromAddress: string,
  amount: number,
) {
  const nonce = (await web3.eth.getTransactionCount(adminAddress)) + 1
  const signedTx = await web3.eth.accounts.signTransaction(
    {
      from: adminAddress,
      value: web3.utils.toWei('0', 'ether'),
      gasPrice,
      gas,
      nonce,
      data: contracts[currencyType].methods
        .burn(web3.utils.toChecksumAddress(fromAddress), amount)
        .encodeABI(),
    },
    settings.BLOCKCHAIN_PRIVATE_KEY,
  )

  if (!signedTx.rawTransaction) {
    throw new Error('Failed to sign transaction')
  }

  const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
  return receipt.transactionHash
}

export async function createAccount() {
  return web3.eth.accounts.create()
}

export async function getUserBalance(
  currencyType: CurrencyType,
  address: string,
) {
  const balance = await contracts[currencyType].methods
    .balanceOf(web3.utils.toChecksumAddress(address))
    .call()
  return balance
}
