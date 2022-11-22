import Web3 from 'web3'
import { AbiItem } from 'web3-utils'

import abi from './abi.json'
import { settings } from '@/lib/common'

const web3 = new Web3(settings.BLOCKCHAIN_URL)
const gasPrice = web3.utils.toWei(
  settings.BLOCKCHAIN_GAS_PRICE.toString(),
  'gwei',
)
const gas = settings.BLOCKCHAIN_GAS
const creditContract = new web3.eth.Contract(
  abi as AbiItem[],
  settings.BLOCKCHAIN_CREDIT_ADDRESS,
)
const pointContract = new web3.eth.Contract(
  abi as AbiItem[],
  settings.BLOCKCHAIN_POINT_ADDRESS,
)

export async function transfer(
  fromAddress: string,
  toAddress: string,
  amount: number,
  nonce: number,
) {
  const signedTx = await web3.eth.accounts.signTransaction(
    {
      from: fromAddress,
      to: toAddress,
      data: creditContract.methods
        .transferFrom(
          web3.utils.toChecksumAddress(fromAddress),
          web3.utils.toChecksumAddress(toAddress),
          amount,
        )
        .encodeABI(),
      gasPrice,
      gas,
      nonce,
    },
    settings.BLOCKCHAIN_PRIVATE_KEY,
  )

  if (!signedTx.rawTransaction) {
    throw new Error('Failed to sign transaction')
  }

  const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
  return receipt
}
