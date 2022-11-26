import type { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

import { handleTwmpNotify } from '@/lib/server/twmp'
import { updateTwmpDeposit } from '@/lib/server/database'

const requestBodySchema = z.object({
  txn_content: z.string().min(1),
  verifyCode: z.string().min(1),
})

export default async function api(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  try {
    const requestBody = requestBodySchema.parse(req.body)
    const result = await handleTwmpNotify(requestBody)

    await updateTwmpDeposit(
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
