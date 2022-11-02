import type { NextApiRequest, NextApiResponse } from 'next'
import { tokenCache } from '@/utils/cached'
import superjson from 'superjson'
import { settings } from '@/utils/settings'
import { validateAuthToken } from '@/utils/database'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!(settings.COOKIE_NAME in req.cookies)) {
    res.status(401).send('Unauthorized')
    return
  }

  const user = await validateAuthToken(req.cookies[settings.COOKIE_NAME]!)
  if (!user) {
    res.status(401).send('Unauthorized')
    return
  }

  if (user.role !== 'ADMIN') {
    res.status(403).send('Forbidden: ADMIN only')
  }

  res.setHeader('Content-Type', 'application/json')
  res.status(200).send(superjson.stringify(tokenCache.listAll()))
}
