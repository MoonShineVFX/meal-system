import type { NextApiRequest, NextApiResponse } from 'next'

import { completeDishedUpOrders } from '@/lib/server/database'

export default async function syncUsers(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  try {
    const orders = await completeDishedUpOrders()

    console.log(`[SYNC] Result: ${orders.length} orders completed`)

    return res.status(200).json({
      completedCount: orders.length,
    })
  } catch (error) {
    if (error instanceof Error) {
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
