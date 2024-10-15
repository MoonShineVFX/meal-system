import fs from 'fs'
import { prismaCient } from '../../../src/lib/server/database'
import { settings } from '../../../src/lib/common'

export async function rollbackRecharge() {
  // Read the file /temp/rollback.json and rollback the recharge
  const rollbackData = fs.readFileSync('./temp/rollback.json', 'utf8')
  const rollbackNames = JSON.parse(rollbackData) as string[]

  if (rollbackNames.length === 0) {
    throw new Error('No rollback data found')
  }

  const users = await prismaCient.user.findMany({
    where: {
      name: {
        in: rollbackNames,
      },
    },
    select: {
      id: true,
      name: true,
      pointBalance: true,
    },
  })

  const userIds = users.map((user) => user.id)
  if (userIds.length !== rollbackNames.length) {
    throw new Error('Some users were not found')
  }

  for (const user of users) {
    console.log(`${user.name} (${user.id}): ${user.pointBalance}`)
  }

  // await prismaCient.$transaction(async (tx) => {
  //   await tx.user.updateMany({
  //     where: {
  //       id: {
  //         in: userIds,
  //       },
  //     },
  //     data: {
  //       pointBalance: {
  //         decrement: 50,
  //       },
  //     },
  //   })

  //   await tx.transaction.createMany({
  //     data: users.map((user) => ({
  //       sourceUserId: user.id,
  //       targetUserId: settings.SERVER_USER_ID,
  //       pointAmount: 50,
  //       type: 'RECYCLE',
  //       note: '作業錯誤，點數重複發送',
  //     })),
  //   })
  // })
}

export async function run() {
  await rollbackRecharge()
  console.log('Recharge done')
}
