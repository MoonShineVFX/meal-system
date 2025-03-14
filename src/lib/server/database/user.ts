import { Prisma, User, UserAuthority, UserRole } from '@prisma/client'
import CryptoJS from 'crypto-js'

import { prisma, log } from './define'
import { getResourceUrl, settings } from '@/lib/common'
import { rechargeUserBalanceBase, rechargeUserBalance } from './transaction'

type EnsureUserArgs = {
  userId: string
  name?: string
  password?: string
  role?: UserRole
  pointBalance?: number
  creditBalance?: number
  email?: string
  isIntern?: boolean
}
export async function ensureUser({
  userId,
  name,
  password,
  role,
  pointBalance,
  creditBalance,
  email,
  isIntern,
}: EnsureUserArgs) {
  const updateData = {
    name: name,
    role: role,
    pointBalance: pointBalance,
    creditBalance: creditBalance,
    password: password ? CryptoJS.SHA256(password).toString() : undefined,
    email: email,
    isIntern: isIntern ?? false,
  } satisfies Prisma.UserUpdateInput

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
  })

  // If user profile image exists, create one
  if (!user.profileImageId) {
    try {
      const response = await fetch(
        `${getResourceUrl()}/image/profile/${userId}.jpg`,
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
    select: {
      isDeactivated: true,
      password: true,
    },
  })

  if (user && user.password === CryptoJS.SHA256(password).toString()) {
    if (user.isDeactivated) {
      throw new Error('使用者已停用')
    }

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
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          authorities: true,
          isDeactivated: true,
        },
      },
    },
  })
  if (!userToken) return null

  if (userToken.user.isDeactivated) {
    throw new Error('使用者已停用')
  }

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
  isIntern: true,
  // Settings
  optMenuNotify: true,
})

export async function getUserInfo(userId: string) {
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

  // Start checking bonus
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

  return { user, isRedeemed }
}

export async function rechargeUserToday(props: {
  userId: string
  pointAmount: number
}) {
  const { userId, pointAmount } = props
  const now = new Date()

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      lastPointRechargeTime: true,
      isDeactivated: true,
    },
  })

  // Validate
  if (!user) {
    throw new Error('使用者不存在')
  }

  if (user.isDeactivated) {
    throw new Error('使用者已停用')
  }

  if (
    user.lastPointRechargeTime &&
    now.toDateString() === user.lastPointRechargeTime.toDateString()
  ) {
    throw new Error('今日已充值')
  }

  // Update last recharge time to today and prevent time attack
  try {
    await prisma.user.update({
      where: {
        id: userId,
        lastPointRechargeTime: user.lastPointRechargeTime,
      },
      data: {
        lastPointRechargeTime: now,
      },
      select: {
        name: true,
      },
    })
  } catch (e) {
    throw new Error('已有充值動作正在進行中')
  }

  // Check is today a work day
  const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const isHoliday = settings.HOLIDAYS.includes(currentDay.getTime())
  const isWeekDay =
    !isHoliday && currentDay.getDay() > 0 && currentDay.getDay() < 6
  const isMakuUpDay = settings.MAKE_UP_DAYS.includes(currentDay.getTime())
  if (!isMakuUpDay && !isWeekDay) {
    throw new Error('今日不是工作日')
  }

  // Recharge
  await rechargeUserBalance({
    userId: userId,
    pointAmount: pointAmount,
  })
}

export async function updateUserSettings(
  props: { userId: string } & Partial<Pick<User, 'optMenuNotify'>>,
) {
  const { userId, ...data } = props
  await prisma.user.update({
    where: {
      id: userId,
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

export async function getUsersStatistics(props: { showDeactivated?: boolean }) {
  const now = new Date()
  const users = await prisma.user.findMany({
    where: {
      id: {
        notIn: ['_server', '_client'],
      },
      isDeactivated: props.showDeactivated ? undefined : false,
    },
    select: {
      id: true,
      name: true,
      role: true,
      pointBalance: true,
      creditBalance: true,
      authorities: true,
      profileImage: {
        select: {
          path: true,
        },
      },
      isDeactivated: true,
      _count: {
        select: {
          orders: {
            where: {
              timeCanceled: null,
              forClient: false,
              createdAt: {
                gte: new Date(now.getFullYear(), now.getMonth(), 1),
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return users
}

export async function syncAdUsers(existUserIds: string[]) {
  // Deactivate users that are not in the AD list
  const deactivateResult = await prisma.user.updateMany({
    where: {
      id: {
        notIn: [
          ...existUserIds,
          settings.SERVER_USER_ID,
          settings.SERVER_CLIENTORDER_ID,
        ],
      },
      isDeactivated: false,
    },
    data: {
      isDeactivated: true,
    },
  })

  // Activate users that are in the AD list
  const activateResult = await prisma.user.updateMany({
    where: {
      id: {
        in: existUserIds,
      },
      isDeactivated: true,
    },
    data: {
      isDeactivated: false,
      pointBalance: 0,
    },
  })

  return {
    activatedUsers: activateResult.count,
    deactivatedUsers: deactivateResult.count,
  }
}

export async function updateUserAuthority(props: {
  userId: string
  authority: UserAuthority
  enabled: boolean
}) {
  const user = await prisma.user.findUnique({
    where: {
      id: props.userId,
    },
    select: {
      authorities: true,
    },
  })

  if (!user) {
    throw new Error('使用者不存在')
  }

  if (props.enabled && user.authorities.includes(props.authority)) {
    return null
  }

  if (!props.enabled && !user.authorities.includes(props.authority)) {
    return null
  }

  return await prisma.user.update({
    where: {
      id: props.userId,
    },
    data: {
      authorities: {
        set: props.enabled
          ? [...user.authorities, props.authority]
          : user.authorities.filter((a) => a !== props.authority),
      },
    },
    select: {
      name: true,
    },
  })
}
