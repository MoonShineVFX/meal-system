import type { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

import { handleTradeNotify } from '@/lib/server/deposit/newebpay'
import webPusher from '@/lib/server/webpush'

const requestBodySchema = z.object({
  Status: z.string().min(1),
  MerchantID: z.string().min(1),
  Version: z.string().min(1),
  TradeInfo: z.string().min(1),
  TradeSha: z.string().min(1),
})

export default async function api(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  try {
    const requestBody = requestBodySchema.parse(req.body)
    const result = await handleTradeNotify(requestBody)

    if (result) {
      webPusher.pushNotificationToUser({
        userId: result.userId,
        title: '夢想幣儲值成功',
        message: `已成功儲值 ${result.amount} 元`,
      })
    }

    res.status(200).send('OK')
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn(error)
      res.status(400).json({
        error: error.issues,
      })
    } else if (error instanceof Error) {
      console.warn(error)
      res.status(500).json({
        error: error.message,
      })
    } else {
      console.warn('unknown')
      res.status(500).json({
        error: 'unknown error',
      })
    }
  }
}
