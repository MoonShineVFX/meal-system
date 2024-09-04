import type { NextApiRequest, NextApiResponse } from 'next'

import { settings } from '@/lib/common'
import { syncAdUsers } from '@/lib/server/database'

export default async function syncUsers(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  try {
    const adDataResponse = await fetch(`${settings.AUTH_API_URL}/ad`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${settings.AUTH_API_TOKEN}`,
      },
    })
    const adData = await adDataResponse.json()
    const usernames = adData.map((user: any) => user.username.toLowerCase())

    const syncResult = await syncAdUsers(usernames)
    console.log(`[SYNC] Result: ${syncResult}`)

    return res.status(200).json({
      syncResult,
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
