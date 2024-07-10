import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { settings } from '@/lib/common'
import { rechargeInternUserToday } from '@/lib/server/database'

const requestBodySchema = z.object({
  userIds: z.array(z.string()),
})

async function callRechargeInternUser(userId: string) {
  try {
    await rechargeInternUserToday({ userId })
    return { userId, result: 'SUCCESS' }
  } catch (error) {
    return {
      userId,
      result: `ERROR: ${
        error instanceof Error ? error.message : 'Unknown Error'
      }`,
    }
  }
}

export default async function rechargeInternUsers(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Validate method
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  // Validate authorization
  if (req.headers.authorization !== `Bearer ${settings.AUTH_API_TOKEN}`) {
    res.status(401).end()
    return
  }

  // Validate request body
  const requestBodyParsed = requestBodySchema.safeParse(req.body)
  if (!requestBodyParsed.success) {
    res.status(400).json({
      error: requestBodyParsed.error.errors,
    })
    return
  }

  const requestBody = requestBodyParsed.data
  const results = await Promise.all(
    requestBody.userIds.map((userId) => callRechargeInternUser(userId)),
  )

  // Combine to { userId: result }
  const resultObject = results.reduce((acc, result) => {
    acc[result.userId] = result.result
    return acc
  }, {} as Record<string, string>)
  res.status(200).json(resultObject)
}
