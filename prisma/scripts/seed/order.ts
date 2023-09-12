import { UserRole, MenuType } from '@prisma/client'
import {
  ensureUser,
  prismaCient,
  createCartItem,
  createOrderFromCart,
} from '../../../src/lib/server/database'
import {
  ConvertPrismaJson,
  OptionSet,
  OrderOptions,
} from '../../../src/lib/common'

const userMockData = [
  {
    id: '_user_0',
    name: '使用者0',
    role: UserRole.USER,
    pointBalance: 500000,
    creditBalance: 500000,
  },
  {
    id: '_user_1',
    name: '使用者1',
    role: UserRole.USER,
    pointBalance: 500000,
    creditBalance: 500000,
  },
  {
    id: '_user_2',
    name: '使用者2',
    role: UserRole.USER,
    pointBalance: 500000,
    creditBalance: 500000,
  },
  {
    id: '_user_3',
    name: '使用者3',
    role: UserRole.USER,
    pointBalance: 500000,
    creditBalance: 500000,
  },
  {
    id: '_user_4',
    name: '使用者4',
    role: UserRole.USER,
    pointBalance: 500000,
    creditBalance: 500000,
  },
  {
    id: '_user_5',
    name: '使用者5',
    role: UserRole.USER,
    pointBalance: 500000,
    creditBalance: 500000,
  },
  {
    id: '_user_6',
    name: '使用者6',
    role: UserRole.USER,
    pointBalance: 500000,
    creditBalance: 500000,
  },
  {
    id: '_user_7',
    name: '使用者7',
    role: UserRole.USER,
    pointBalance: 500000,
    creditBalance: 500000,
  },
  {
    id: '_user_8',
    name: '使用者8',
    role: UserRole.USER,
    pointBalance: 500000,
    creditBalance: 500000,
  },
  {
    id: '_user_9',
    name: '使用者9',
    role: UserRole.USER,
    pointBalance: 500000,
    creditBalance: 500000,
  },
]

function randomPickOptions(optionSets: OptionSet[]): OrderOptions {
  const options: OrderOptions = {}
  for (const optionSet of optionSets) {
    if (optionSet.multiSelect) {
      const pickedOptions = optionSet.options.filter(() => Math.random() > 0.5)
      options[optionSet.name] = pickedOptions
      continue
    }
    const option =
      optionSet.options[Math.floor(Math.random() * optionSet.options.length)]
    options[optionSet.name] = option
  }
  return options
}

export async function seedLiveOrders() {
  // ensure users
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

  // get live coms
  const coms = await prismaCient.commodityOnMenu.findMany({
    where: {
      menu: {
        type: MenuType.LIVE,
      },
      isDeleted: false,
    },
    include: {
      commodity: {
        select: {
          optionSets: true,
        },
      },
    },
  })

  // add to cart
  for (let i = 0; i < 100; i++) {
    console.log('>> Seed order:', i)
    const user = userMockData[Math.floor(Math.random() * userMockData.length)]

    const itemCount = Math.floor(Math.random() * 3) + 1
    for (let a = 0; a < itemCount; a++) {
      const oCom = coms[Math.floor(Math.random() * coms.length)]
      const com = oCom as ConvertPrismaJson<typeof oCom>

      await createCartItem({
        userId: user.id,
        menuId: com.menuId,
        commodityId: com.commodityId,
        quantity: Math.floor(Math.random() * 3) + 1,
        options: randomPickOptions(com.commodity.optionSets),
      })
    }

    await createOrderFromCart({
      userId: user.id,
    })
  }
}
