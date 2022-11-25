import CryptoJS from 'crypto-js'
import { TwmpResultStatus } from '@prisma/client'

import { settings } from '@/lib/common'

/* Type */
type RequestBody = Record<string, string>

enum PayStatus {
  SUCCESS = 'S',
  FAILED = 'F',
  REFUNDED = 'R',
  REFUND_FAILED = 'L',
}

enum PaymentTool {
  DEBIT = 'F',
  VISA = 'V',
  MASTER = 'M',
  JCB = 'J',
  UNION = 'C',
}

enum RefundType {
  CANCEL = 'CANCEL',
  REFUND = 'REFUND',
}

enum TwmpDepositType {
  DESKTOP,
  MOBILE,
}

type CreateTwmpDepositResult<T> = T extends TwmpDepositType.MOBILE
  ? { TwmpURL: string; txnID: string }
  : { qrcode: string; txnID: string }

type CreateTwmpDepositResponse<T> = T extends TwmpDepositType.MOBILE
  ? {
      code: string
      msg: string
      txnID: string
      TwmpURL: string
      verifyCode: string
    }
  : {
      code: string
      msg: string
      txnID: string
      qrcode: string
      verifyCode: string
    }

type TwmpDepositNotifyTxnContent = {
  acqBank: string // '001'
  merchandId: string // '109100001004156'
  terminalId: string // '10900002'
  orderNo: string // '0000123456789098'
  txnID: string // '494194165261930496'
  txnUID: string // 'da5d521f9fdd4dc0866e26f0d84f6ba4'
  transAMT: string // '3000'
  txnTime: string // '101010'
  payStatus: PayStatus // 'S'
  txnDate: string // '20200828'
  paymentTool: PaymentTool // 'F'
}

export type TwmpDepositNotifyRequest = {
  txn_content: string
  verifyCode: string
}

type FindTwmpDepositTxnContentDetail = {
  txnUID: string // 'de05133edeb94bfabfe5757be27354a0'
  transAMT: string // '1800'
  txnTime: string // '135916'
  payStatus: PayStatus // 'R'
  txnDate: string // '20220330'
  refundAMT: string // '0'
  paymentTool: PaymentTool // 'F'
}

type FindTwmpDepositTxnContent = {
  acqBank: string // '006'
  merchantId: string // '006263015610919'
  terminalId: string // '90010001'
  orderNo: string // '000012345678941100'
  txnID: string // '706232917298655232'
  detail: FindTwmpDepositTxnContentDetail[]
}

type FindTwmpDepositResponse = {
  code: string
  msg: string
  txn_content: string
  verifyCode: string
}

type CancelTwmpDepositRefundContent = {
  acqBank: string
  merchantId: string
  terminalId: string
  orderNo: string
  txnID: string
  txnUID: string
  txnType: RefundType
  transAMT: string
  refundAMT: string
  txnDate: string
  txnTime: string
  payStatus: PayStatus
}

type CancelTwmpDepositResponse = {
  code: string
  msg: string
  refund_content: string
  verifyCode: string
}

/* Functions */
function parseTxnTime(txnDate: string, txnTime: string) {
  const date =
    txnDate.slice(0, 4) + '-' + txnDate.slice(4, 6) + '-' + txnDate.slice(6, 8)
  const time =
    txnTime.slice(0, 2) + ':' + txnTime.slice(2, 4) + ':' + txnTime.slice(4, 6)
  return new Date(`${date}T${time}.000+08:00`)
}

function parsePayStatus(payStatus: PayStatus) {
  switch (payStatus) {
    case PayStatus.SUCCESS:
      return TwmpResultStatus.SUCCESS
    case PayStatus.REFUNDED:
      return TwmpResultStatus.CANCELED
    case PayStatus.FAILED:
    case PayStatus.REFUND_FAILED:
      return TwmpResultStatus.FAILED
    default:
      throw new Error('Unknown payStatus', payStatus)
  }
}

function encodeVerifyCode(...inputs: string[]) {
  const inputsHash = CryptoJS.SHA256(inputs.join(''))
  return CryptoJS.TripleDES.encrypt(
    inputsHash,
    CryptoJS.enc.Hex.parse(settings.TWMP_3DES_KEY),
    {
      iv: CryptoJS.enc.Hex.parse(settings.TWMP_3DES_IV),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.NoPadding,
    },
  )
    .toString(CryptoJS.format.Hex)
    .toUpperCase()
}

export function encodeCallbackCode(...inputs: string[]) {
  const inputsHash = CryptoJS.SHA256(inputs.join('') + settings.TWMP_FISC_KEY)
  return inputsHash.toString(CryptoJS.enc.Hex).toUpperCase()
}

/* 4.1 特店 Server 呼叫 twMP 線上購物 Server 進行交易  */
export async function createTwmpDeposit<T extends TwmpDepositType>(
  orderNo: string,
  amount: number,
  callbackHost: string,
  type: T,
) {
  const requestBody: RequestBody = {
    acqBank: settings.TWMP_ACQ_BANK,
    merchantId: settings.TWMP_MERCHANT_ID,
    terminalId: settings.TWMP_TERMINAL_ID,
    orderNo: orderNo,
    transAMT: amount.toString(),
    currency: '901',
  }

  if (type === TwmpDepositType.MOBILE) {
    requestBody['txnType'] = 'A'
    requestBody['callbackURL'] = `${callbackHost}/twmp/result`
    requestBody['verifyCode'] = encodeVerifyCode(
      requestBody.acqBank,
      requestBody.merchantId,
      requestBody.terminalId,
      requestBody.orderNo,
      requestBody.transAMT,
      requestBody.currency,
      requestBody.txnType,
      requestBody.callbackURL,
    )
  } else if (type === TwmpDepositType.DESKTOP) {
    requestBody['txnType'] = 'P'
    requestBody['qrcodeType'] = '1'
    requestBody['verifyCode'] = encodeVerifyCode(
      requestBody.acqBank,
      requestBody.merchantId,
      requestBody.terminalId,
      requestBody.orderNo,
      requestBody.transAMT,
      requestBody.currency,
      requestBody.txnType,
    )
  } else {
    throw new Error('Unknown payment type')
  }

  const response = await fetch(
    `${settings.TWMP_API_URL}/WebQR/api/MerchantNotifyTwmpTrans`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        charset: 'UTF-8',
      },
      body: JSON.stringify(requestBody),
    },
  )

  if (!response.ok) throw new Error(`${response.statusText}`)

  let responseBody: CreateTwmpDepositResponse<T> = await response.json()
  if (requestBody.code !== '0000') {
    throw new Error(`[${responseBody.code}] ${responseBody.msg}`)
  }

  let responseVerifyCode: string
  if (type === TwmpDepositType.MOBILE) {
    responseVerifyCode = encodeVerifyCode(
      responseBody.code,
      responseBody.txnID,
      (responseBody as CreateTwmpDepositResponse<TwmpDepositType.MOBILE>)
        .TwmpURL,
    )
  } else if (type === TwmpDepositType.DESKTOP) {
    responseVerifyCode = encodeVerifyCode(
      responseBody.code,
      responseBody.txnID,
      (responseBody as CreateTwmpDepositResponse<TwmpDepositType.DESKTOP>)
        .qrcode,
    )
  } else {
    throw new Error('Unknown payment type')
  }

  if (responseVerifyCode !== responseBody.verifyCode) {
    throw new Error('invalid verify code from response')
  }

  if (type === TwmpDepositType.MOBILE) {
    return {
      TwmpURL: (
        responseBody as CreateTwmpDepositResponse<TwmpDepositType.MOBILE>
      ).TwmpURL,
      txnID: responseBody.txnID,
    } as CreateTwmpDepositResult<TwmpDepositType.MOBILE>
  } else if (type === TwmpDepositType.DESKTOP) {
    return {
      qrcode: (
        responseBody as CreateTwmpDepositResponse<TwmpDepositType.DESKTOP>
      ).qrcode,
      txnID: responseBody.txnID,
    } as CreateTwmpDepositResult<TwmpDepositType.DESKTOP>
  } else {
    throw new Error('Unknown payment type')
  }
}

/* 5.1 twMP 線上購物 Server 將交易結果通知特店 Server */
export async function handleTwmpDepositNotify(
  requestBody: TwmpDepositNotifyRequest,
) {
  const requestVerifyCode = encodeVerifyCode(requestBody.txn_content)

  if (requestVerifyCode !== requestBody.verifyCode) {
    throw new Error('invalid verify code from request')
  }

  const content = JSON.parse(
    requestBody.txn_content,
  ) as TwmpDepositNotifyTxnContent
  return {
    ...content,
    time: parseTxnTime(content.txnDate, content.txnTime),
    status: parsePayStatus(content.payStatus),
  }
}

/* 5.2 特店 Server 呼叫 twMP 線上購物 Server 進行交易查詢 */
export async function findTwmpDeposit(txnID: string) {
  const requestBody: RequestBody = {
    txnID: txnID,
    verifyCode: encodeVerifyCode(txnID),
  }

  const response = await fetch(
    `${settings.TWMP_API_URL}/WebQR/api/QryTwmpTrans`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        charset: 'UTF-8',
      },
      body: JSON.stringify(requestBody),
    },
  )

  if (!response.ok) {
    throw new Error(`${response.statusText}`)
  }

  const responseBody: FindTwmpDepositResponse = await response.json()
  if (requestBody.code !== '0000') {
    throw new Error(`[${responseBody.code}] ${responseBody.msg}`)
  }

  const responseVerifyCode = encodeVerifyCode(
    responseBody.code,
    responseBody.txn_content,
  )

  if (responseVerifyCode !== responseBody.verifyCode) {
    throw new Error('invalid verify code from response')
  }

  return JSON.parse(responseBody.txn_content) as FindTwmpDepositTxnContent
}

/* 5.3 特店 Server 呼叫 twMP 線上購物 Server 進行取消交易 */
export async function CancelTwmpDeposit(
  txnID: string,
  txnUID: string,
  amount: number,
) {
  const requestBody: RequestBody = {
    txnID: txnID,
    txnUID: txnUID,
    txnType: 'CANCEL', // 'REFUND' for partial refund
    refundAMT: amount.toString(),
  }

  requestBody['verifyCode'] = encodeVerifyCode(
    requestBody.txnID,
    requestBody.txnUID,
    requestBody.txnType,
    requestBody.refundAMT,
  )

  const response = await fetch(
    `${settings.TWMP_API_URL}/WebQR/api/TwmpTransRefun`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        charset: 'UTF-8',
      },
      body: JSON.stringify(requestBody),
    },
  )

  if (!response.ok) {
    throw new Error(`${response.statusText}`)
  }

  const responseBody: CancelTwmpDepositResponse = await response.json()
  if (requestBody.code !== '0000') {
    throw new Error(`[${responseBody.code}] ${responseBody.msg}`)
  }

  const responseVerifyCode = encodeVerifyCode(
    responseBody.code,
    responseBody.refund_content,
  )

  if (responseVerifyCode !== responseBody.verifyCode) {
    throw new Error('invalid verify code from response')
  }

  return JSON.parse(
    responseBody.refund_content,
  ) as CancelTwmpDepositRefundContent
}
