import CryptoJS from 'crypto-js'

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

enum TwmpPaymentType {
  DESKTOP,
  MOBILE,
}
type CreateTwmpPaymentResult<T> = T extends TwmpPaymentType.MOBILE
  ? { TwmpURL: string; txnID: string }
  : { qrcode: string; txnID: string }

type CreateTwmpPaymentResponse<T> = T extends TwmpPaymentType.MOBILE
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

type TwmpPaymentNotifyTxnContent = {
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

export type TwmpPaymentNotifyRequest = {
  txn_content: string
  verifyCode: string
}

type FindTwmpPaymentTxnContentDetail = {
  txnUID: string // 'de05133edeb94bfabfe5757be27354a0'
  transAMT: string // '1800'
  txnTime: string // '135916'
  payStatus: PayStatus // 'R'
  txnDate: string // '20220330'
  refundAMT: string // '0'
  paymentTool: PaymentTool // 'F'
}

type FindTwmpPaymentTxnContent = {
  acqBank: string // '006'
  merchantId: string // '006263015610919'
  terminalId: string // '90010001'
  orderNo: string // '000012345678941100'
  txnID: string // '706232917298655232'
  detail: FindTwmpPaymentTxnContentDetail[]
}

type FindTwmpPaymentResponse = {
  code: string
  msg: string
  txn_content: string
  verifyCode: string
}

type CancelTwmpPaymentRefundContent = {
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

type CancelTwmpPaymentResponse = {
  code: string
  msg: string
  refund_content: string
  verifyCode: string
}

/* Functions */
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

/* 4.1 特店 Server 呼叫 twMP 線上購物 Server 進行交易  */
export async function createTwmpPayment<T extends TwmpPaymentType>(
  orderNo: string,
  amount: number,
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

  if (type === TwmpPaymentType.MOBILE) {
    requestBody['txnType'] = 'A'
    requestBody['callbackURL'] = '_TODO_CALLBACKURL'
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
  } else if (type === TwmpPaymentType.DESKTOP) {
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
    throw Error('Unknown payment type')
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

  if (!response.ok) {
    return Error(`${response.statusText}`)
  }

  let responseBody: CreateTwmpPaymentResponse<T> = await response.json()
  if (requestBody.code !== '0000') {
    return Error(`[${responseBody.code}] ${responseBody.msg}`)
  }

  let responseVerifyCode: string
  if (type === TwmpPaymentType.MOBILE) {
    responseVerifyCode = encodeVerifyCode(
      responseBody.code,
      responseBody.txnID,
      (responseBody as CreateTwmpPaymentResponse<TwmpPaymentType.MOBILE>)
        .TwmpURL,
    )
  } else if (type === TwmpPaymentType.DESKTOP) {
    responseVerifyCode = encodeVerifyCode(
      responseBody.code,
      responseBody.txnID,
      (responseBody as CreateTwmpPaymentResponse<TwmpPaymentType.DESKTOP>)
        .qrcode,
    )
  } else {
    return Error('Unknown payment type')
  }

  if (responseVerifyCode !== responseBody.verifyCode) {
    return Error('invalid verify code from response')
  }

  if (type === TwmpPaymentType.MOBILE) {
    return {
      TwmpURL: (
        responseBody as CreateTwmpPaymentResponse<TwmpPaymentType.MOBILE>
      ).TwmpURL,
      txnID: responseBody.txnID,
    } as CreateTwmpPaymentResult<TwmpPaymentType.MOBILE>
  } else if (type === TwmpPaymentType.DESKTOP) {
    return {
      qrcode: (
        responseBody as CreateTwmpPaymentResponse<TwmpPaymentType.DESKTOP>
      ).qrcode,
      txnID: responseBody.txnID,
    } as CreateTwmpPaymentResult<TwmpPaymentType.DESKTOP>
  }
}

/* 5.1 twMP 線上購物 Server 將交易結果通知特店 Server */
export async function handleTwmpPaymentNotify(
  requestBody: TwmpPaymentNotifyRequest,
) {
  const requestVerifyCode = encodeVerifyCode(requestBody.txn_content)

  if (requestVerifyCode !== requestBody.verifyCode) {
    return Error('invalid verify code from request')
  }

  return JSON.parse(requestBody.txn_content) as TwmpPaymentNotifyTxnContent
}

/* 5.2 特店 Server 呼叫 twMP 線上購物 Server 進行交易查詢 */
export async function findTwmpPayment(txnID: string) {
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
    return Error(`${response.statusText}`)
  }

  const responseBody: FindTwmpPaymentResponse = await response.json()
  if (requestBody.code !== '0000') {
    return Error(`[${responseBody.code}] ${responseBody.msg}`)
  }

  const responseVerifyCode = encodeVerifyCode(
    responseBody.code,
    responseBody.txn_content,
  )

  if (responseVerifyCode !== responseBody.verifyCode) {
    return Error('invalid verify code from response')
  }

  return JSON.parse(responseBody.txn_content) as FindTwmpPaymentTxnContent
}

/* 5.3 特店 Server 呼叫 twMP 線上購物 Server 進行取消交易 */
export async function CancelTwmpPayment(
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
    return Error(`${response.statusText}`)
  }

  const responseBody: CancelTwmpPaymentResponse = await response.json()
  if (requestBody.code !== '0000') {
    return Error(`[${responseBody.code}] ${responseBody.msg}`)
  }

  const responseVerifyCode = encodeVerifyCode(
    responseBody.code,
    responseBody.refund_content,
  )

  if (responseVerifyCode !== responseBody.verifyCode) {
    return Error('invalid verify code from response')
  }

  return JSON.parse(
    responseBody.refund_content,
  ) as CancelTwmpPaymentRefundContent
}
