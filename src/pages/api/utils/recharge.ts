import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { settings } from '@/lib/common'
import { rechargeUserToday } from '@/lib/server/database'
import { getLogger } from '@/lib/server/logger'

const log = getLogger('api/utils/recharge')

const requestBodySchema = z.object({
  // v1 compatibility
  userIds: z.array(z.string()).optional(),
  // v2, points: { 100: ['user1', 'user2'], 200: ['user3'] }
  points: z
    .record(z.coerce.number().int().positive(), z.array(z.string()))
    .optional(),
})

async function callRechargeUser(props: {
  userId: string
  pointAmount: number
}) {
  const { userId, pointAmount } = props

  try {
    await rechargeUserToday({ userId, pointAmount })
    return { userId, result: `SUCCESS (${pointAmount})` }
  } catch (error) {
    return {
      userId,
      result: `ERROR: ${
        error instanceof Error ? error.message : 'Unknown Error'
      }`,
    }
  }
}

export default async function rechargeUsers(
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

  const rechargePayloads: { userId: string; pointAmount: number }[] = []

  // log
  log('Recharge request:', JSON.stringify(requestBody))

  // v1 compatibility
  if (requestBody.userIds) {
    rechargePayloads.push(
      ...requestBody.userIds.map((userId) => ({
        userId,
        pointAmount: settings.POINT_DAILY_RECHARGE_AMOUNT,
      })),
    )
  }

  // v2
  if (requestBody.points) {
    for (const [pointAmount, userIds] of Object.entries(requestBody.points)) {
      const pointAmountNumber = Number(pointAmount)
      if (isNaN(pointAmountNumber)) {
        res.status(400).json({
          error: `Invalid point amount: ${pointAmount}`,
        })
        return
      }
      rechargePayloads.push(
        ...userIds.map((userId) => ({
          userId,
          pointAmount: pointAmountNumber,
        })),
      )
    }
  }

  // Check conflict userIds
  const userIds = new Set<string>()
  for (const { userId } of rechargePayloads) {
    if (userIds.has(userId)) {
      res.status(400).json({
        error: `Conflict userId: ${userId}`,
      })
      return
    }
    userIds.add(userId)
  }

  const results = await Promise.all(rechargePayloads.map(callRechargeUser))

  // Combine to { userId: result }
  const resultObject = results.reduce((acc, result) => {
    acc[result.userId] = result.result
    return acc
  }, {} as Record<string, string>)

  log('Recharge result:', JSON.stringify(resultObject))
  res.status(200).json(resultObject)
}
