import { Prisma, UserRole, UserSettings } from '@prisma/client'
import CryptoJS from 'crypto-js'

import { prisma, log } from './define'
import { settings } from '@/lib/common'
import { rechargeUserBalanceBase, rechargeUserBalance } from './transaction'

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

export async function getUserList() {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
    },
  })
}

export async function getUserLite({ token }: { token: string }) {
  const userToken = await prisma.userToken.findUnique({
    where: { id: token },
    include: {
      user: { select: { id: true, name: true, role: true, authorities: true } },
    },
  })
  if (!userToken) return null

  prisma.userToken.update({
    where: { id: token },
    data: { lastUsedAt: new Date() },
  })

  return { ...userToken.user, token: userToken.id }
}

const userInfoSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  role: true,
  pointBalance: true,
  creditBalance: true,
  lastPointRechargeTime: true,
  lastBonusCheckTime: true,
  authorities: true,
  profileImage: {
    select: {
      path: true,
    },
  },
  settings: true,
})

export async function getUserInfo(userId: string) {
  let shouldCheckRecharge = false
  let shouldCheckBonus = false

  // get today on local date
  const now = new Date(new Date().toDateString())

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userInfoSelect,
  })

  if (!user) return null

  if (
    !user.lastBonusCheckTime ||
    now.toDateString() !== user.lastBonusCheckTime.toDateString()
  ) {
    try {
      await prisma.user.update({
        where: {
          id: userId,
          OR: [
            {
              lastBonusCheckTime: {
                not: now,
              },
            },
            {
              lastBonusCheckTime: null,
            },
          ],
        },
        data: {
          lastBonusCheckTime: now,
        },
      })
      shouldCheckBonus = true
    } catch (e) {
      // Delay timing
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return getUserInfo(userId)
    }
  }

  if (
    !user.lastPointRechargeTime ||
    now.toDateString() !== user.lastPointRechargeTime.toDateString()
  ) {
    try {
      await prisma.user.update({
        where: {
          id: userId,
          OR: [
            {
              lastPointRechargeTime: {
                not: now,
              },
            },
            {
              lastPointRechargeTime: null,
            },
          ],
        },
        data: {
          lastPointRechargeTime: now,
        },
      })
      shouldCheckRecharge = true
    } catch (e) {
      // Delay timing
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return getUserInfo(userId)
    }
  }

  // Start checking
  let isRecharged = false
  let isRedeemed = false

  // Check and redeem bonus
  if (shouldCheckBonus) {
    const validBonus = await prisma.bonus.findMany({
      where: {
        OR: [
          {
            validAt: null,
          },
          {
            validAt: {
              gte: now,
            },
          },
        ],
        isDeleted: false,
        users: {
          some: {
            id: userId,
          },
        },
        redeemUsers: {
          none: {
            id: userId,
          },
        },
      },
    })

    for (const b of validBonus) {
      try {
        await prisma.$transaction(async (client) => {
          await rechargeUserBalanceBase({
            userId: userId,
            pointAmount: b.amount,
            bonusId: b.id,
            client,
          })
          await client.bonus.update({
            where: {
              id: b.id,
              redeemUsers: {
                none: {
                  id: userId,
                },
              },
            },
            data: {
              redeemUsers: {
                connect: {
                  id: userId,
                },
              },
            },
          })
          user.pointBalance += b.amount
        })
      } catch (e) {
        continue
      }
    }

    isRedeemed = validBonus.length > 0
  }

  // Check and recharge point
  if (shouldCheckRecharge) {
    // If no last recharge time, set yesterday
    const lastRechargeTime =
      user.lastPointRechargeTime ??
      new Date(now.getTime() - 24 * 60 * 60 * 1000)

    lastRechargeTime.setDate(lastRechargeTime.getDate() + 1)
    let currentDay = new Date(
      lastRechargeTime.getFullYear(),
      lastRechargeTime.getMonth(),
      lastRechargeTime.getDate(),
    )
    const targetDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    let rechargeAmount = 0
    while (currentDay.getTime() <= targetDay.getTime()) {
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

    if (rechargeAmount > 0) {
      const { user: newUser } = await rechargeUserBalance({
        userId: user.id,
        pointAmount: rechargeAmount,
      })
      user.pointBalance = newUser.pointBalance
    }
  }

  return { user, isRecharged, isRedeemed }
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
