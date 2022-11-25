import type { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

import { handleTwmpPaymentNotify } from '@/lib/server/twmp'
import { updateTwmpPayment } from '@/lib/server/database'

const schema = z.object({
  txn_content: z.string().min(1),
  verifyCode: z.string().min(1),
})

export default async function api(req: NextApiRequest, res: NextApiResponse) {
  try {
    const requestBody = schema.parse(req.body)
    const result = await handleTwmpPaymentNotify(requestBody)

    if (result instanceof Error) throw result

    await updateTwmpPayment(
      result.orderNo,
      result.txnUID,
      result.status,
      result.time,
    )
    res.status(200).send('OK')
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: error.issues,
      })
    } else if (error instanceof Error) {
      res.status(500).json({
        error: error.message,
      })
    } else {
      res.status(500).json({
        error: 'unknown error',
      })
    }
  }
}
