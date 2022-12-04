import { UserRole } from '@prisma/client'
import { settings } from '@/lib/common'

export const menuMockData = {
  飲料: {
    optionSets: [
      {
        name: '冰量',
        multiSelect: false,
        options: ['熱飲', '正常冰', '少冰', '微冰', '去冰'],
      },
      {
        name: '糖度',
        multiSelect: false,
        options: ['正常糖', '少糖', '微糖', '無糖'],
      },
      {
        name: '加料',
        multiSelect: true,
        options: ['珍珠', '椰果'],
      },
    ],
    subCategories: {
      咖啡: [
        { name: '拿鐵', price: 40 },
        { name: '美式', price: 30 },
        { name: '卡布奇諾', price: 40 },
        { name: '摩卡', price: 45 },
      ],
      茶類: [
        { name: '綠茶', price: 30 },
        { name: '紅茶', price: 30 },
        { name: '奶茶', price: 35 },
        { name: '烏龍茶', price: 20 },
      ],
    },
  },
  餐點: {
    optionSets: [
      {
        name: '辣度',
        multiSelect: false,
        options: ['微辣', '小辣', '中辣', '大辣'],
      },
      {
        name: '備註',
        multiSelect: true,
        options: ['不加香菜', '純素', '不要蔥'],
      },
    ],
    subCategories: {
      早餐: [
        { name: '蛋餅', price: 35 },
        { name: '吐司', price: 20, options: ['奶油', '花生', '巧克力'] },
        { name: '漢堡', price: 25 },
      ],
      西式: [
        { name: '紅酒燉牛肉', price: 120 },
        { name: '焗烤千層', price: 100 },
        { name: '碳烤豬肋排', price: 150 },
      ],
      中式: [
        { name: '鍋燒烏龍麵', price: 80 },
        { name: '蝦仁炒飯', price: 100 },
        { name: '炒泡麵', price: 60 },
      ],
    },
  },
  點心: {
    optionSets: [
      {
        name: '調味',
        multiSelect: false,
        options: ['胡椒鹽', '番茄醬', '無調味'],
      },
    ],
    subCategories: {
      甜點: [
        { name: '波士頓蛋糕', price: 70 },
        { name: '起司蛋糕', price: 65 },
        { name: '蛋塔', price: 40 },
      ],
      炸物: [
        { name: '薯條', price: 40 },
        { name: '薯餅', price: 30 },
        { name: '雞米花', price: 50 },
      ],
    },
  },
}

export const userMockData = [
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
