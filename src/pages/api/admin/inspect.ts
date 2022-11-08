import type { NextApiRequest, NextApiResponse } from 'next'
import { tokenCache } from '@/utils/cached'
import superjson from 'superjson'
import { settings } from '@/utils/settings'
import { validateAuthToken } from '@/utils/database'
import { validateRole } from '@/utils/settings'
import { Role } from '@prisma/client'
import { eventsCentral } from '@/utils/event'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!(settings.COOKIE_TOKEN_NAME in req.cookies)) {
    res.status(401).send('Unauthorized')
    return
  }

  const user = await validateAuthToken(req.cookies[settings.COOKIE_TOKEN_NAME]!)
  if (!user) {
    res.status(401).send('Unauthorized')
    return
  }

  if (!validateRole(user.role, Role.ADMIN)) {
    res.status(403).send('Forbidden: ADMIN only')
  }

  res.setHeader('Content-Type', 'application/json')
  res.status(200).send(
    superjson.stringify({
      tokenCache: await tokenCache.listAll(),
      eventsCentral: await eventsCentral.listAll(),
    }),
  )
}
