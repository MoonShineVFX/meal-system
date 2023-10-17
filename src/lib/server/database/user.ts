import { UserRole, UserSettings } from '@prisma/client'
import CryptoJS from 'crypto-js'

import { prisma, log } from './define'
import { settings } from '@/lib/common'
import { rechargeUserBalanceBase } from './transaction'

type EnsureUserArgs = {
  userId: string
  name?: string
  password?: string
  role?: UserRole
  pointBalance?: number
  creditBalance?: number
  email?: string
}
export async function ensureUser({
  userId,
  name,
  password,
  role,
  pointBalance,
  creditBalance,
  email,
}: EnsureUserArgs) {
  const updateData = {
    name: name,
    role: role,
    pointBalance: pointBalance,
    creditBalance: creditBalance,
    password: password ? CryptoJS.SHA256(password).toString() : undefined,
    email: email,
  }

  const user = await prisma.user.upsert({
    where: {
      id: userId,
    },
    update: updateData,
    create: {
      ...updateData,
      id: userId,
      name: name ?? userId,
    },
    include: {
      settings: true,
    },
  })

  // If user does not have a user settings, create one
  if (!user.settings) {
    await prisma.userSettings.create({
      data: {
        userId: user.id,
      },
    })
  }

  // If user profile image exists, create one
  if (!user.profileImageId) {
    try {
      const response = await fetch(
        `${settings.RESOURCE_URL}/image/profile/${userId}.jpg`,
        {
          method: 'HEAD',
        },
      )
      if (response.ok) {
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            profileImage: {
              create: {
                path: `profile/${userId}.jpg`,
              },
            },
          },
        })
      }
    } catch (e) {
      log(e)
    }
  }
}

export async function createUserToken(userId: string) {
  const userToken = await prisma.userToken.create({
    data: {
      userId: userId,
      lastUsedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          tokens: {
            orderBy: {
              lastUsedAt: 'asc',
            },
          },
        },
      },
    },
  })

  const { tokens: userTokens } = userToken.user

  // Limit tokens per user
  if (userTokens.length > settings.TOKEN_COUNT_PER_USER) {
    const toDeleteTokenIds = userTokens
      .slice(0, userTokens.length - settings.TOKEN_COUNT_PER_USER)
      .map((t) => t.id)
    await prisma.userToken.deleteMany({
      where: {
        id: { in: toDeleteTokenIds },
      },
    })
  }

  return userToken.id
}

export async function validateUserPassword(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  })

  if (user && user.password === CryptoJS.SHA256(password).toString()) {
    return true
  }

  return false
}

export async function getUserLite({ token }: { token: string }) {
  const userToken = await prisma.userToken.findUnique({
    where: { id: token },
    include: { user: { select: { id: true, name: true, role: true } } },
  })
  if (!userToken) return null

  prisma.userToken.update({
    where: { id: token },
    data: { lastUsedAt: new Date() },
  })

  return { ...userToken.user, token: userToken.id }
}

export async function getUserInfo(userId: string) {
  const result = await prisma.$transaction(async (client) => {
    let user = await client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        pointBalance: true,
        creditBalance: true,
        lastPointRechargeTime: true,
        authorities: true,
        profileImage: {
          select: {
            path: true,
          },
        },
        settings: true,
      },
    })

    if (!user) return null

    // Check if user needs to recharge points
    let isRecharged = false
    let thisCallback: (() => void) | undefined = undefined
    const now = new Date()
    // if no last recharge time, set yesterday
    const lastRechargeTime =
      user.lastPointRechargeTime ??
      new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // If last recharge time is not today, recharge
    if (now.toLocaleDateString() !== lastRechargeTime.toLocaleDateString()) {
      lastRechargeTime.setDate(lastRechargeTime.getDate() + 1)
      let currentDay = new Date(
        lastRechargeTime.getFullYear(),
        lastRechargeTime.getMonth(),
        lastRechargeTime.getDate(),
      )
      const targetDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      )

      let rechargeAmount = 0
      let isNewMonth = false

      while (currentDay.getTime() <= targetDay.getTime()) {
        // If month changed, reset recharge amount
        if (currentDay.getMonth() !== targetDay.getMonth()) {
          isNewMonth = true
          rechargeAmount = 0
          currentDay = new Date(
            currentDay.getFullYear(),
            currentDay.getMonth() + 1,
            1,
          )
          continue
        }
        // If day is weekday and not make-up day, recharge
        const isHoliday = settings.HOLIDAYS.includes(currentDay.getTime())
        const isWeekDay =
          !isHoliday && currentDay.getDay() > 0 && currentDay.getDay() < 6
        const isMakuUpDay = settings.MAKE_UP_DAYS.includes(currentDay.getTime())

        if (isMakuUpDay || isWeekDay) {
          rechargeAmount += settings.POINT_DAILY_RECHARGE_AMOUNT
        }
        currentDay = new Date(currentDay.getTime() + 24 * 60 * 60 * 1000)
      }

      // Update last recharge time
      await client.user.update({
        where: { id: user.id },
        data: {
          lastPointRechargeTime: now,
        },
      })

      if (rechargeAmount === 0 && !isNewMonth) return null

      // Recharge points
      const rechargePointAmount = isNewMonth
        ? rechargeAmount - user.pointBalance
        : rechargeAmount

      if (rechargePointAmount > 0) {
        const { callback, user: newUser } = await rechargeUserBalanceBase({
          userId: user.id,
          pointAmount: isNewMonth
            ? rechargeAmount - user.pointBalance
            : rechargeAmount,
          client,
        })
        thisCallback = callback
        user.pointBalance = newUser.pointBalance
      }

      isRecharged = true
    }

    const { lastPointRechargeTime, ...resultUser } = user
    return { user: resultUser, isRecharged, callback: thisCallback }
  })

  if (result === null) return null

  const { user, isRecharged, callback } = result
  if (callback) callback()

  return { user, isRecharged }
}

export async function updateUserSettings(
  props: { userId: string } & Partial<UserSettings>,
) {
  const { userId, ...data } = props
  await prisma.userSettings.update({
    where: {
      userId,
    },
    data,
  })
}

export async function updateUserToken(props: {
  userToken: string
  notificationEnabled?: boolean
  badgeEnabled?: boolean
  endpoint?: string
  p256dh?: string
  auth?: string
}) {
  const {
    userToken,
    endpoint,
    p256dh,
    auth,
    notificationEnabled,
    badgeEnabled,
  } = props

  if (endpoint) {
    await deleteSubscription({ endpoint: endpoint })
  }

  const userSub = await prisma.userToken.update({
    where: {
      id: userToken,
    },
    data: {
      notificationEnabled,
      badgeEnabled,
      endpoint,
      p256dh,
      auth,
    },
  })

  return userSub
}

export async function deleteSubscription(props: { endpoint: string }) {
  const userToken = await prisma.userToken.findUnique({
    where: {
      endpoint: props.endpoint,
    },
  })

  if (!userToken) return

  await prisma.userToken.update({
    where: {
      id: userToken.id,
    },
    data: {
      endpoint: null,
      p256dh: null,
      auth: null,
    },
  })
}

export async function getUserTokens(userId: string) {
  const userSubs = await prisma.userToken.findMany({
    where: {
      userId,
    },
  })

  return userSubs
}

export async function getUsersTokens(userIds: string[]) {
  const userSubs = await prisma.userToken.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
  })

  return userSubs
}

export async function deleteUserToken(token: string) {
  await prisma.userToken.delete({
    where: {
      id: token,
    },
  })
}

export async function getUserToken(token: string) {
  const userSub = await prisma.userToken.findUnique({
    where: {
      id: token,
    },
  })

  return userSub
}
