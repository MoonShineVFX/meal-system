import { NextApiRequest, NextApiResponse } from 'next'
import { getPusherServer } from '@/lib/server/pusher'
import { getUserLite } from '@/lib/server/database'
import { settings, validateRole } from '@/lib/common'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify the user is authenticated
  const token = req.cookies[settings.COOKIE_TOKEN_NAME]
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userLite = await getUserLite({ token })
  if (!userLite) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get the socket id and channel name from the request
  const { socket_id, channel_name } = req.body

  if (!socket_id || !channel_name) {
    return res.status(400).json({ error: 'Missing socket_id or channel_name' })
  }

  // Check if the user is authorized to access the channel
  if (
    channel_name === 'private-staff-message' &&
    !validateRole(userLite.role, 'STAFF')
  ) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (channel_name.startsWith('private-user-message-')) {
    const channelUserId = channel_name.replace('private-user-message-', '')
    if (channelUserId !== userLite.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }
  }

  // Generate auth signature for the channel
  try {
    const pusher = getPusherServer()
    const auth = pusher.authorizeChannel(socket_id, channel_name)
    res.status(200).json(auth)
  } catch (error) {
    console.error('Pusher authorization error:', error)
    res.status(500).json({ error: 'Failed to authorize channel' })
  }
}
