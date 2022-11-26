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

export enum PaymentType {
  DESKTOP,
  MOBILE,
}

type CreateTwmpResult<T> = T extends PaymentType.MOBILE
  ? { twmpUrl: string; txnID: string }
  : { qrcode: string; txnID: string }

type CreateTwmpResponse<T> = T extends PaymentType.MOBILE
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

type TwmpNotifyTxnContent = {
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

export type TwmpNotifyRequest = {
  txn_content: string
  verifyCode: string
}

type GetTwmpTxnContentDetail = {
  txnUID: string // 'de05133edeb94bfabfe5757be27354a0'
  transAMT: string // '1800'
  txnTime: string // '135916'
  payStatus: PayStatus // 'R'
  txnDate: string // '20220330'
  refundAMT: string // '0'
  paymentTool: PaymentTool // 'F'
}

type GetTwmpTxnContent = {
  acqBank: string // '006'
  merchantId: string // '006263015610919'
  terminalId: string // '90010001'
  orderNo: string // '000012345678941100'
  txnID: string // '706232917298655232'
  detail: GetTwmpTxnContentDetail[]
}

type GetTwmpResponse = {
  code: string
  msg: string
  txn_content: string
  verifyCode: string
}

type CancelTwmpRefundContent = {
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

type CancelTwmpResponse = {
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
      throw new Error(`Unknown payStatus: ${payStatus}`)
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
export async function createTwmp(
  orderNo: string,
  amount: number,
  callbackHost?: string, // if valid, mobile payment will be used
) {
  const requestBody: RequestBody = {
    acqBank: settings.TWMP_ACQ_BANK,
    merchantId: settings.TWMP_MERCHANT_ID,
    terminalId: settings.TWMP_TERMINAL_ID,
    orderNo: orderNo,
    transAMT: amount.toString(),
    currency: '901',
  }

  const isMobile = !!callbackHost

  if (isMobile) {
    requestBody['txnType'] = 'A'
    requestBody['callbackURL'] = `${callbackHost}/twmp/callback`
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
  } else {
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

  let responseBody: CreateTwmpResponse<PaymentType> = await response.json()
  if (requestBody.code !== '0000') {
    throw new Error(`[${responseBody.code}] ${responseBody.msg}`)
  }

  let responseVerifyCode: string
  if (isMobile) {
    responseVerifyCode = encodeVerifyCode(
      responseBody.code,
      responseBody.txnID,
      (responseBody as CreateTwmpResponse<PaymentType.MOBILE>).TwmpURL,
    )
  } else {
    responseVerifyCode = encodeVerifyCode(
      responseBody.code,
      responseBody.txnID,
      (responseBody as CreateTwmpResponse<PaymentType.DESKTOP>).qrcode,
    )
  }

  if (responseVerifyCode !== responseBody.verifyCode) {
    throw new Error('invalid verify code from response')
  }

  if (isMobile) {
    return {
      twmpUrl: (responseBody as CreateTwmpResponse<PaymentType.MOBILE>).TwmpURL,
      txnID: responseBody.txnID,
    } as CreateTwmpResult<PaymentType.MOBILE>
  } else {
    const originalQrcode = (
      responseBody as CreateTwmpResponse<PaymentType.DESKTOP>
    ).qrcode
    return {
      qrcode: encodeURI(originalQrcode),
      txnID: responseBody.txnID,
    } as CreateTwmpResult<PaymentType.DESKTOP>
  }
}

/* 5.1 twMP 線上購物 Server 將交易結果通知特店 Server */
export async function handleTwmpNotify(requestBody: TwmpNotifyRequest) {
  const requestVerifyCode = encodeVerifyCode(requestBody.txn_content)

  if (requestVerifyCode !== requestBody.verifyCode) {
    throw new Error('invalid verify code from request')
  }

  const content = JSON.parse(requestBody.txn_content) as TwmpNotifyTxnContent
  return {
    ...content,
    time: parseTxnTime(content.txnDate, content.txnTime),
    status: parsePayStatus(content.payStatus),
  }
}

/* 5.2 特店 Server 呼叫 twMP 線上購物 Server 進行交易查詢 */
export async function getTwmp(txnID: string) {
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

  const responseBody: GetTwmpResponse = await response.json()
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

  const content = JSON.parse(responseBody.txn_content) as GetTwmpTxnContent
  return {
    ...content,
    detail: content.detail.map((d) => ({
      ...d,
      time: parseTxnTime(d.txnDate, d.txnTime),
      status: parsePayStatus(d.payStatus),
    })),
  }
}

/* 5.3 特店 Server 呼叫 twMP 線上購物 Server 進行取消交易 */
export async function CancelTwmp(
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

  const responseBody: CancelTwmpResponse = await response.json()
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

  return JSON.parse(responseBody.refund_content) as CancelTwmpRefundContent
}
