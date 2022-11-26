import { Role } from '@prisma/client'
import { ensureUser } from '@/lib/server/database'

const mockData = [
  {
    id: '_server',
    name: '伺服器',
    role: Role.SERVER,
    pointBalance: 2000,
    creditBalance: 2000,
  },
  {
    id: '_admin',
    name: '管理員',
    role: Role.ADMIN,
    pointBalance: 500,
    creditBalance: 1000,
  },
  {
    id: '_staff',
    name: '員工',
    role: Role.STAFF,
    pointBalance: 500,
    creditBalance: 1000,
  },
  {
    id: '_user',
    name: '使用者',
    role: Role.USER,
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
