import type { NextApiRequest, NextApiResponse } from 'next'
import { tokenCache } from '@/utils/cached'
import superjson from 'superjson'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).send('Forbidden: dev env only')
  }

  res.setHeader('Content-Type', 'application/json')
  res.status(200).send(superjson.stringify(tokenCache.listAll()))
}
