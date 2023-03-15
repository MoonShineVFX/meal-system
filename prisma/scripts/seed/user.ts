import { ensureUser } from '../../../src/lib/server/database'
import { userMockData } from './mock'

export default async function seedUser() {
  for (const mock of userMockData) {
    console.log('>> Seed user:', mock.id)
    await ensureUser({
      userId: mock.id,
      name: mock.name,
      role: mock.role,
      pointBalance: mock.pointBalance,
      creditBalance: mock.creditBalance,
    })
  }
}
