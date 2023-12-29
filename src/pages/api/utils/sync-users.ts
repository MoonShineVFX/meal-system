import type { NextApiRequest, NextApiResponse } from 'next'

import { settings } from '@/lib/common'
import { deactivateUsers } from '@/lib/server/database'

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

    const deactivatedUsers = await deactivateUsers(usernames)
    console.log(`[SYNC] Deactivated ${deactivatedUsers} users`)

    return res.status(200).json({
      deactivatedUsers,
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
