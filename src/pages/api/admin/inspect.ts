import type { NextApiRequest, NextApiResponse } from 'next'
import { Role } from '@prisma/client'
import superjson from 'superjson'

import { tokenCache } from '@/lib/server/cached'
import { validateAuthToken } from '@/lib/server/database'
import { validateRole, settings } from '@/lib/common'
import { eventsCentral } from '@/lib/server/event'

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
