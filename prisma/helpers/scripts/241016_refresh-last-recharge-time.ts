import fs from 'fs'
import { prismaCient } from '../../../src/lib/server/database'
import { settings } from '../../../src/lib/common'

export async function refreshLastRecharge() {
  // Get yesterday's date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  await prismaCient.user.updateMany({
    data: {
      lastPointRechargeTime: yesterday,
    },
  })
}

export async function run() {
  await refreshLastRecharge()
  console.log('done')
}
