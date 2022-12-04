import { ensureUser } from '@/lib/server/database'
import { userMockData } from './mock'

export default async function seedUser() {
  for (const mock of userMockData) {
    console.log('>> Seed user:', mock.id)
    await ensureUser(
      mock.id,
      mock.name,
      mock.role,
      mock.pointBalance,
      mock.creditBalance,
    )
  }
}
