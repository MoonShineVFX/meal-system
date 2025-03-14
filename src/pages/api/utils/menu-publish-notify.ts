import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { MenuTypeName, settings } from '@/lib/common'
import { PUSHER_CHANNEL, PUSHER_EVENT } from '@/lib/common/pusher'
import { prisma } from '@/lib/server/database/define'
import { emitPusherEvent } from '@/lib/server/pusher'
import webPusher from '@/lib/server/webpush'
import { getLogger } from '@/lib/server/logger'
import { updateMenuPublishNotifyEventToLatest } from '@/lib/trpc/api/menu'

const log = getLogger('api/utils/menu-publish-notify')

const requestBodySchema = z.object({
  menuId: z.number().int().positive(),
})

export default async function menuPublishNotify(
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

  const { menuId } = requestBodyParsed.data
  const now = new Date()

  try {
    // Validate menu
    const menu = await prisma.menu.findUnique({
      where: {
        id: menuId,
      },
      select: {
        id: true,
        type: true,
        publishedDate: true,
        closedDate: true,
      },
    })

    if (!menu) {
      log('Menu not found')
      res.status(404).json({ error: 'Menu not found' })
      return
    }

    if (menu.type === 'LIVE' || menu.type === 'RETAIL') {
      log('Menu is not reservation menu')
      res.status(400).json({ error: 'Menu is not reservation menu' })
      return
    }

    if (menu.publishedDate === null) {
      log('Menu is not published')
      res.status(400).json({ error: 'Menu is not published' })
      return
    }

    if (menu.publishedDate > now) {
      log('Menu is not published yet')
      res.status(400).json({ error: 'Menu is not published yet' })
      return
    }

    if (menu.publishedDate < new Date(now.getTime() - 60000)) {
      log('Menu is Published')
      res.status(400).json({ error: 'Menu is already published' })
      return
    }

    if (menu.closedDate !== null && menu.closedDate < now) {
      log('Menu is closed')
      res.status(400).json({ error: 'Menu is closed' })
      return
    }

    // Gather users
    const users = await prisma.user.findMany({
      where: {
        isDeactivated: false,
        optMenuNotify: true,
      },
      select: {
        id: true,
      },
    })

    // Send notification
    await Promise.all(
      users.map(async (user) => {
        await Promise.all([
          emitPusherEvent(PUSHER_CHANNEL.USER(user.id), {
            type: PUSHER_EVENT.MENU_RESERVATION_UPDATE,
            message: `${MenuTypeName[menu.type]}已開放訂購`,
            link: `/reserve?m=${menu.id}`,
            skipNotify: true,
          }),
          webPusher.pushNotificationToUser({
            userId: user.id,
            title: `${MenuTypeName[menu.type]}已開放訂購`,
            message: `請點擊連結前往`,
            url: `${settings.WEBSITE_URL}/reserve?m=${menu.id}`,
            ignoreIfFocused: true,
          }),
        ])
      }),
    )

    log(`Notifications sent to ${users.length} users`)
    res.status(200).json({
      notifyCount: users.length,
    })
  } catch (error) {
    log('Error in menu publish notify:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  } finally {
    await updateMenuPublishNotifyEventToLatest()
  }
}
