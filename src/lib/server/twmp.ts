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

type CreateTwmpPaymentResponse<T> = T extends true
  ? { callbackUrl: string; txnID: string }
  : T extends false
  ? { qrcode: string; txnID: string }
  : never

type FindTwmpPaymentResponseDetail = {
  txnUID: string // 'de05133edeb94bfabfe5757be27354a0'
  transAMT: string // '1800'
  txnTime: string // '135916'
  payStatus: PayStatus // 'R'
  txnDate: string // '20220330'
  refundAMT: string // '0'
  paymentTool: PaymentTool // 'F'
}

type FindTwmpPaymentResponse = {
  acqBank: string // '006'
  merchantId: string // '006263015610919'
  terminalId: string // '90010001'
  orderNo: string // '000012345678941100'
  txnID: string // '706232917298655232'
  detail: FindTwmpPaymentResponseDetail[]
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
export async function createTwmpPayment<T extends boolean>(
  orderNo: string,
  amount: number,
  isMobile: T,
) {
  const requestBody: RequestBody = {
    acqBank: settings.TWMP_ACQ_BANK,
    merchantId: settings.TWMP_MERCHANT_ID,
    terminalId: settings.TWMP_TERMINAL_ID,
    orderNo: orderNo,
    transAMT: amount.toString(),
    currency: '901',
  }

  if (isMobile) {
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

  if (!response.ok) {
    return Error(`${response.statusText}`)
  }

  const responseBody = await response.json()
  if (requestBody['code'] !== '0000') {
    return Error(`[${responseBody['code']}] ${responseBody['msg']}`)
  }

  let responseVerifyCode: string
  if (isMobile) {
    responseVerifyCode = encodeVerifyCode(
      responseBody['code'],
      responseBody['txnID'],
      responseBody['TwmpURL'],
    )
  } else {
    responseVerifyCode = encodeVerifyCode(
      responseBody['code'],
      responseBody['txnID'],
      responseBody['qrcode'],
    )
  }

  if (responseVerifyCode !== responseBody['verifyCode']) {
    return Error('invalid verify code from response')
  }

  if (isMobile) {
    return {
      callbackUrl: responseBody['TwmpURL'],
      txnID: responseBody['txnID'],
    } as CreateTwmpPaymentResponse<T>
  } else {
    return {
      qrcode: responseBody['qrcode'],
      txnID: responseBody['txnID'],
    } as CreateTwmpPaymentResponse<T>
  }
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

  const responseBody = await response.json()
  if (requestBody['code'] !== '0000') {
    return Error(`[${responseBody['code']}] ${responseBody['msg']}`)
  }

  const responseVerifyCode = encodeVerifyCode(
    responseBody['code'],
    responseBody['txn_content'],
  )

  if (responseVerifyCode !== responseBody['verifyCode']) {
    return Error('invalid verify code from response')
  }

  return JSON.parse(responseBody['txn_content']) as FindTwmpPaymentResponse
}

// 5.1
// const textContent_5_1 = {
//   acqBank: '001',
//   merchandId: '109100001004156',
//   terminalId: '10900002',
//   orderNo: '0000123456789098',
//   txnID: '494194165261930496',
//   txnUID: 'da5d521f9fdd4dc0866e26f0d84f6ba4',
//   transAMT: '3000',
//   txnTime: '101010',
//   payStatus: 'S',
//   txnDate: '20200828',
//   paymentTool: 'F',
// }
// 5.2
