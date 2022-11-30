import { UserRole } from '@prisma/client'
import { ensureUser } from '@/lib/server/database'
import { settings } from '@/lib/common'

const mockData = [
  {
    id: settings.SERVER_USER_ID,
    name: '伺服器',
    role: UserRole.ADMIN,
    pointBalance: 2000,
    creditBalance: 2000,
  },
  {
    id: '_admin',
    name: '管理員',
    role: UserRole.ADMIN,
    pointBalance: 500,
    creditBalance: 1000,
  },
  {
    id: '_staff',
    name: '員工',
    role: UserRole.STAFF,
    pointBalance: 500,
    creditBalance: 1000,
  },
  {
    id: '_user',
    name: '使用者',
    role: UserRole.USER,
    pointBalance: 500,
    creditBalance: 1000,
  },
]

async function main() {
  for (const mock of mockData) {
    console.log('>> Seed user:', mock.name)
    await ensureUser(
      mock.id,
      mock.name,
      mock.role,
      mock.pointBalance,
      mock.creditBalance,
    )
  }
  console.log('>> Seed finished')
}

main()
