import { DepositStatus } from '@prisma/client'
import { settings } from '@/lib/common'
import CryptoJS from 'crypto-js'

import { updateDeposit } from '@/lib/server/database'

const API_VERSION = '2.0'

export async function createMPGRequest(props: {
  depositId: string
  amount: number
  email?: string
}) {
  const tradeInfo = {
    MerchantID: settings.NEWEBPAY_MERCHANT_ID,
    RespondType: 'JSON',
    TimeStamp: Math.floor(Date.now() / 1000),
    Version: API_VERSION,
    LangType: 'zh-tw',
    MerchantOrderNo: props.depositId,
    Amt: props.amount,
    ItemDesc: `夢想幣 ${props.amount} 元`,
    ReturnURL: `${settings.NEWEBPAY_RETURN_URL}?depositId=${props.depositId}`,
    NotifyURL: settings.NEWEBPAY_NOTIFY_URL,
    Email: props.email ?? '',
    LoginType: 0,
    CREDIT: 1,
    ANDROIDPAY: 1,
    SAMSUNGPAY: 1,
    WEBATM: 1,
    TAIWANPAY: 1,
  }

  const tradeInfoParams = new URLSearchParams(
    Object.entries(tradeInfo).reduce((acc, [key, value]) => {
      let valueString: string
      if (typeof value === 'string') {
        valueString = value
      } else if (typeof value === 'number') {
        valueString = value.toString()
      } else {
        valueString = JSON.stringify(value)
      }
      return { ...acc, [key]: valueString }
    }, {}),
  ).toString()

  const tradeInfoAES = encryptAES(tradeInfoParams)
  const tradeSha = encryptSHA(tradeInfoAES)

  return {
    tradeInfo: tradeInfoAES,
    tradeSha,
    version: API_VERSION,
    merchantId: settings.NEWEBPAY_MERCHANT_ID,
    action: `${settings.NEWEBPAY_API_URL}/MPG/mpg_gateway`,
  }
}

export async function getAndUpdateTradeInfo(props: {
  depositId: string
  amount: number
}) {
  const queryContent: Record<string, string> = {
    Amt: props.amount.toString(),
    MerchantID: settings.NEWEBPAY_MERCHANT_ID,
    MerchantOrderNo: props.depositId,
  }

  const checkValueBodyParams = new URLSearchParams(queryContent).toString()
  const checkValue = generateCheckValue(checkValueBodyParams)

  queryContent['CheckValue'] = checkValue
  queryContent['Version'] = '1.3'
  queryContent['RespondType'] = 'JSON'
  queryContent['TimeStamp'] = Math.floor(Date.now() / 1000).toString()

  const formData = new FormData()
  Object.entries(queryContent).forEach(([key, value]) => {
    formData.append(key, value)
  })

  const response = await fetch(
    `${settings.NEWEBPAY_API_URL}/API/QueryTradeInfo`,
    {
      method: 'POST',
      body: formData,
    },
  )

  const result: { Status: string; Message: string; Result: any } =
    await response.json()

  if (result.Status !== 'SUCCESS') {
    // TRA10021: 查無交易資料，回傳null
    if (result.Status === 'TRA10021') {
      return null
    }
    throw new Error(`查詢交易失敗 (${result.Status}): ${result.Message}`)
  }

  if (
    !verifyCheckCode(result.Result as Parameters<typeof verifyCheckCode>[0])
  ) {
    throw new Error('查詢交易失敗: CheckCode 驗證失敗')
  }

  return await updateDeposit({
    id: props.depositId,
    status:
      result.Result['TradeStatus'] === '0'
        ? DepositStatus.PENDING
        : result.Result['TradeStatus'] === '1'
        ? DepositStatus.SUCCESS
        : result.Result['TradeStatus'] === '6'
        ? DepositStatus.REFUND
        : DepositStatus.FAILED,
    payTime: new Date(result.Result['PayTime']),
    paymentType: result.Result['PaymentType'],
  })
}

export async function handleTradeNotify(notify: {
  Status: string
  MerchantID: string
  TradeInfo: string
  TradeSha: string
}) {
  if (notify.MerchantID !== settings.NEWEBPAY_MERCHANT_ID) {
    throw new Error(`商店代號不符: ${notify.MerchantID}`)
  }

  const checkTradeSha = encryptSHA(notify.TradeInfo)
  if (checkTradeSha !== notify.TradeSha) {
    throw new Error('TradeSha 驗證失敗')
  }

  const tradeInfo = JSON.parse(decryptAES(notify.TradeInfo))

  await updateDeposit({
    status:
      tradeInfo['Status'] === 'SUCCESS'
        ? DepositStatus.SUCCESS
        : DepositStatus.FAILED,
    payTime: new Date(tradeInfo['Result']['PayTime']),
    paymentType: tradeInfo['Result']['PaymentType'],
    id: tradeInfo['Result']['MerchantOrderNo'],
  })
}

function encryptAES(data: string) {
  const cipher = CryptoJS.AES.encrypt(
    data,
    CryptoJS.enc.Utf8.parse(settings.NEWEBPAY_HASH_KEY),
    {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
      iv: CryptoJS.enc.Utf8.parse(settings.NEWEBPAY_HASH_IV),
      format: CryptoJS.format.OpenSSL,
    },
  )

  return cipher.toString(CryptoJS.format.Hex)
}

function decryptAES(data: string) {
  const decipher = CryptoJS.AES.decrypt(
    CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(data)),
    CryptoJS.enc.Utf8.parse(settings.NEWEBPAY_HASH_KEY),
    {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
      iv: CryptoJS.enc.Utf8.parse(settings.NEWEBPAY_HASH_IV),
      format: CryptoJS.format.OpenSSL,
    },
  )
  return decipher.toString(CryptoJS.enc.Utf8)
}

function encryptSHA(data: string) {
  const cipher = CryptoJS.SHA256(
    `HashKey=${settings.NEWEBPAY_HASH_KEY}&${data}&HashIV=${settings.NEWEBPAY_HASH_IV}`,
  )
  return cipher.toString(CryptoJS.enc.Hex).toUpperCase()
}

function generateCheckValue(data: string) {
  const cipher = CryptoJS.SHA256(
    `IV=${settings.NEWEBPAY_HASH_IV}&${data}&Key=${settings.NEWEBPAY_HASH_KEY}`,
  )
  return cipher.toString(CryptoJS.enc.Hex).toUpperCase()
}

function verifyCheckCode(props: {
  Amt: number
  MerchantID: string
  MerchantOrderNo: string
  TradeNo: string
  CheckCode: string
}) {
  const checkCodeParams = new URLSearchParams({
    Amt: props.Amt.toString(),
    MerchantID: props.MerchantID,
    MerchantOrderNo: props.MerchantOrderNo,
    TradeNo: props.TradeNo,
  }).toString()
  const cipher = CryptoJS.SHA256(
    `HashIV=${settings.NEWEBPAY_HASH_IV}&${checkCodeParams}&HashKey=${settings.NEWEBPAY_HASH_KEY}`,
  )
  return cipher.toString(CryptoJS.enc.Hex).toUpperCase() === props.CheckCode
}
