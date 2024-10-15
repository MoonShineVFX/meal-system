/* Reset all users points to zero, and add to transactions */

import {
  prismaCient,
  rechargeUserBalanceBase,
} from '../../../src/lib/server/database'

async function main() {
  const users = await prismaCient.user.findMany({
    select: {
      id: true,
    },
  })

  const now = new Date()

  for (const user of users) {
    // Skip client and server users
    if (['_client', '_server'].includes(user.id)) continue

    console.log('>> Reset user:', user.id)
    await prismaCient.$transaction(async (client) => {
      const currentUser = await client.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          pointBalance: true,
        },
      })

      // No user found
      if (!currentUser) return null

      if (currentUser.pointBalance !== 0) {
        console.log('>> Recharge user balance:', -currentUser.pointBalance)
        // Reset user point balance to zero
        await rechargeUserBalanceBase({
          userId: user.id,
          pointAmount: -currentUser.pointBalance,
          client,
        })
      } else {
        // User point balance is already zero
        console.log('>> User point balance is already zero')
      }

      // Overwrite last point recharge time
      await client.user.update({
        where: { id: user.id },
        data: {
          lastPointRechargeTime: now,
        },
      })
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prismaCient.$disconnect()
  })
