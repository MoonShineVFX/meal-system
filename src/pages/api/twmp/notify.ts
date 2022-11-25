import type { NextApiRequest, NextApiResponse } from 'next'
import { handleTwmpPaymentNotify } from '@/lib/server/twmp'
import z from 'zod'

const schema = z.object({
  txn_content: z.string().min(1),
  verifyCode: z.string().min(1),
})

export default async function api(req: NextApiRequest, res: NextApiResponse) {
  try {
    const requestBody = schema.parse(req.body)
    const response = await handleTwmpPaymentNotify(requestBody)

    if (response instanceof Error) throw response

    // TODO: Update twmp database from response
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
