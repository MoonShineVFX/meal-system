import CryptoJS from 'crypto-js'

import secrets from './secrets'

type CreateTwmpPaymentResponse<T> = T extends true
  ? { callbackUrl: string; txnID: string }
  : T extends false
  ? { qrcode: string; txnID: string }
  : never

export async function createTwmpPayment<T extends boolean>(
  orderNo: string,
  amount: number,
  isMobile: T,
) {
  const requestBody: { [key: string]: string } = {
    acqBank: secrets.TWMP_ACQ_BANK,
    merchantId: secrets.TWMP_MERCHANT_ID,
    terminalId: secrets.TWMP_TERMINAL_ID,
    orderNo: orderNo,
    transAMT: amount.toString(),
    currency: '901',
  }

  if (isMobile) {
    requestBody['txnType'] = 'A'
    requestBody['callbackURL'] = '_TODO_CALLBACKURL'
    requestBody['verifyCode'] = encodeVerifyCode([
      requestBody.acqBank,
      requestBody.merchantId,
      requestBody.terminalId,
      requestBody.orderNo,
      requestBody.transAMT,
      requestBody.currency,
      requestBody.txnType,
      requestBody.callbackURL,
    ])
  } else {
    requestBody['txnType'] = 'P'
    requestBody['qrcodeType'] = '1'
    requestBody['verifyCode'] = encodeVerifyCode([
      requestBody.acqBank,
      requestBody.merchantId,
      requestBody.terminalId,
      requestBody.orderNo,
      requestBody.transAMT,
      requestBody.currency,
      requestBody.txnType,
    ])
  }

  const response = await fetch(
    `${secrets.TWMP_API_URL}/WebQR/api/MerchantNotifyTwmpTrans`,
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
    responseVerifyCode = encodeVerifyCode([
      responseBody['code'],
      responseBody['txnID'],
      responseBody['TwmpURL'],
    ])
  } else {
    responseVerifyCode = encodeVerifyCode([
      responseBody['code'],
      responseBody['txnID'],
      responseBody['qrcode'],
    ])
  }

  if (responseVerifyCode !== responseBody['verifyCode']) {
    return Error('invalid verify code')
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

function encodeVerifyCode(inputs: string[]) {
  const inputsHash = CryptoJS.SHA256(inputs.join(''))
  return CryptoJS.TripleDES.encrypt(
    inputsHash,
    CryptoJS.enc.Hex.parse(secrets.TWMP_3DES_KEY),
    {
      iv: CryptoJS.enc.Hex.parse(secrets.TWMP_3DES_IV),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.NoPadding,
    },
  )
    .toString(CryptoJS.format.Hex)
    .toUpperCase()
}
