import type { NextApiRequest, NextApiResponse } from 'next'

import pusherServer from '@/lib/server/pusher'
import { settings } from '@/lib/common'
import { validateAuthToken } from '@/lib/server/database'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(settings.COOKIE_TOKEN_NAME in req.cookies)) {
    res.status(403).send('No cookie included')
    return
  }

  const user = await validateAuthToken(req.cookies[settings.COOKIE_TOKEN_NAME]!)
  if (!user) {
    res.status(403).send('Unauthorized')
    return
  }

  const socketId = req.body.socket_id
  const userPayload = {
    id: user.id,
    user_info: {
      name: user.name,
    },
    watchList: [],
  }

  const authResponse = pusherServer.authenticateUser(socketId, userPayload)
  res.status(200).send(authResponse)
}
