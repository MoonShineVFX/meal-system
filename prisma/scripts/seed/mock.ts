import { UserRole } from '@prisma/client'
import { settings } from '../../../src/lib/common'

export const menuMockData = {
  飲料: {
    optionSets: [
      {
        name: '冰量',
        multiSelect: false,
        order: 0,
        options: ['熱飲', '正常冰', '少冰', '微冰', '去冰'],
      },
      {
        name: '糖度',
        multiSelect: false,
        order: 1,
        options: ['正常糖', '少糖', '微糖', '無糖'],
      },
      {
        name: '加料',
        multiSelect: true,
        order: 2,
        options: ['珍珠', '椰果'],
      },
    ],
    subCategories: {
      咖啡: [
        {
          name: '拿鐵',
          price: 40,
          description:
            '由美式咖啡、牛奶和焦糖糖漿混合而成。特點是咖啡的香味搭配上牛奶的香甜，配上柔和的焦糖糖漿，口感順滑綿密。',
          imageUrl: 'mock/latte.jpg',
        },
        {
          name: '美式',
          price: 30,
          description:
            '由濃縮咖啡和熱水混合而成。特點是口感濃郁，咖啡香味濃厚。',
          imageUrl: 'mock/americano.jpg',
        },
        {
          name: '卡布奇諾',
          price: 40,
          description:
            '擁有濃郁的咖啡香味和香甜的牛奶味道。口感順滑綿密，配上鬆軟的奶泡，提供了一種放鬆身心的感覺。',
          imageUrl: 'mock/cappuccino.jpg',
        },
        {
          name: '摩卡',
          price: 45,
          description:
            '通常由濃縮咖啡、牛奶和巧克力粉混合而成。特點是咖啡的香味搭配上牛奶的香甜，再加上巧克力的香醇，口感順滑綿密。',
          imageUrl: 'mock/mocha.jpg',
        },
      ],
      茶類: [
        {
          name: '綠茶',
          price: 30,
          description:
            '含有大量的抗氧化物質，可以幫助抵抗自由基的傷害，延緩衰老。此外，綠茶還含有茶多酚和優酪胺等物質，可以促進新陳代謝，幫助排毒。它不含任何人工色素、香料或防腐劑，味道清新自然，淡淡的茶香味道。',
          imageUrl: 'mock/green-tea.jpg',
        },
        {
          name: '紅茶',
          price: 30,
          description:
            '擁有濃郁的茶香味和純正的茶口感。特點是口感順滑，茶香味濃厚。',
          imageUrl: 'mock/black-tea.jpg',
        },
        {
          name: '奶茶',
          price: 35,
          description:
            '由紅茶、牛奶和糖漿混合而成。特點是紅茶的清新香氣搭配上牛奶的香甜，再加上糖漿的甜蜜，口感順滑綿密。',
          imageUrl: 'mock/milk-tea.jpg',
        },
        {
          name: '烏龍茶',
          price: 20,
          description:
            '擁有清新的茶香味和純正的茶口感。特點是口感順滑，茶香味淡雅。',
          imageUrl: 'mock/oolong-tea.jpg',
        },
      ],
    },
  },
  餐點: {
    optionSets: [
      {
        name: '辣度',
        multiSelect: false,
        order: 0,
        options: ['微辣', '小辣', '中辣', '大辣'],
      },
      {
        name: '備註',
        multiSelect: true,
        order: 1,
        options: ['不加香菜', '純素', '不要蔥'],
      },
    ],
    subCategories: {
      早餐: [
        {
          name: '蛋餅',
          price: 35,
          description:
            '簡單的早餐，由蛋、麵粉和牛奶混合而成。它的特點是口感軟滑，口味清淡。',
          imageUrl: 'mock/egg-pancake.jpg',
        },
        {
          name: '吐司',
          price: 20,
          options: ['奶油', '花生', '巧克力'],
          description:
            '經典的早餐食品，用麵粉和水混合成的麵糰，然後烘烤而成。它的外表酥脆，口感鬆軟，是一種可口的食品。吐司可以搭配各種配料，例如果醬、沙拉醬、奶油、果醬和肉類，等等，來增加口感和營養。',
          imageUrl: 'mock/toast.jpg',
        },
        {
          name: '漢堡',
          price: 25,
          description:
            '由一塊焗烤的肉餡餅，搭配蔬菜，如生菜，蕃茄和洋蔥，以及選用的醬料和麵包組成。美味可口，而且非常方便，可以在短時間內享用。',
          imageUrl: 'mock/burger.jpg',
        },
      ],
      西式: [
        {
          name: '紅酒燉牛肉',
          price: 120,
          description:
            '經典的法國菜肴，它以紅酒為基底，慢煮牛肉，使肉質鮮嫩多汁。搭配洋蔥，胡蘿蔔，蘑菇和番茄，並以香料如鹽，胡椒和蒜頭調味。在烹飪過程中，紅酒會慢慢煮滾，並混合蔬菜和香料，為整道菜增添深厚的風味。',
          imageUrl: 'mock/red-wine-beef.jpg',
        },
        {
          name: '焗烤千層麵',
          price: 100,
          description:
            '經典的歐洲菜肴，它由多層麵皮和肉餡組成，經過烘焙後呈現香脆口感。肉餡使用碎牛肉或火腿，並搭配馬鈴薯，洋蔥和奶酪調味。在烤箱中焗烤後，麵皮會變得酥脆，而肉餡則會變得香噴噴。',
          imageUrl: 'mock/lasagna.jpg',
        },
        {
          name: '碳烤豬肋排',
          price: 150,
          description:
            '經典的烤肉料理，它以豬肋排為主要食材，經過碳烤後呈現香脆口感。在烤前搭配鹽，胡椒和蒜頭等調味。在碳烤過程中，豬肋排會慢慢烤熟，並從表面產生焦香，同時保持肉質鮮嫩多汁。',
          imageUrl: 'mock/pork-ribs.jpg',
        },
      ],
      中式: [
        {
          name: '鍋燒烏龍麵',
          price: 80,
          description:
            '經典的日本料理，它以烏龍麵為主要食材，搭配豬肉，高湯和各種蔬菜調味。鍋燒烏龍麵的蔬菜包括紅蘿蔔，豆芽，蘑菇和蔥等。在鍋子中煮熟後，烏龍麵會變得鬆軟，而豬肉則會變得鮮嫩多汁。',
          imageUrl: 'mock/wulong.jpg',
        },
        {
          name: '蝦仁炒飯',
          price: 100,
          description:
            '經典的中式料理，它以米飯和蝦仁為主要食材，搭配醬油，蛋和蔬菜調味。蝦仁炒飯的蔬菜包括菜花，胡蘿蔔和青椒等。在鍋子中快速炒熟後，米飯會變得鬆軟，而蝦仁則會變得鮮嫩多汁。',
          imageUrl: 'mock/shrimp-fried-rice.jpg',
        },
        {
          name: '炒泡麵',
          price: 60,
          description:
            '經典的台式料理，它以泡麵為主要食材，搭配醬油，蛋和蔬菜調味。炒泡麵的蔬菜包括菜花，胡蘿蔔和青椒等。在鍋子中快速炒熟後，泡麵會變得鬆軟，而蛋則會變得鮮嫩多汁。',
          imageUrl: 'mock/chow-mein.jpg',
        },
      ],
    },
  },
  點心: {
    optionSets: [
      {
        name: '調味',
        multiSelect: false,
        order: 0,
        options: ['胡椒鹽', '番茄醬', '無調味'],
      },
    ],
    subCategories: {
      甜點: [
        {
          name: '波士頓蛋糕',
          price: 70,
          description:
            '由馬斯卡彭餅和果醬層層疊組成，波士頓蛋糕的果醬會使用草莓或櫻桃醬，並搭配奶油醬調味。',
          imageUrl: 'mock/boston-cake.jpg',
        },
        {
          name: '起司蛋糕',
          price: 65,
          description:
            '由麵糊和奶酪製成。並有一層脆脆的酥皮表面，裡面是柔軟而濃密的奶酪餡料。配以水果醬或果醬，提供額外的甜味，提供清新的口感。',
          imageUrl: 'mock/cheese-cake.jpg',
        },
        {
          name: '蛋塔',
          price: 40,
          description:
            '受歡迎的法國點心，通常由酥皮和蛋黃餡製成。呈橢圓形，表面有金黃色的酥皮，裡面是柔軟而香甜的蛋黃餡。',
          imageUrl: 'mock/egg-tart.jpg',
        },
      ],
      炸物: [
        {
          name: '薯條',
          price: 40,
          description:
            '由馬鈴薯切成長條狀，並炸成酥脆的條狀食物。有一層脆脆的外皮，裡面是軟嫩的薯蓉。',
          imageUrl: 'mock/fries.jpg',
        },
        {
          name: '薯餅',
          price: 30,
          description:
            '由馬鈴薯和麵粉製成的食物，呈圓形扁平狀。有一層脆脆的外皮，裡面是軟嫩的薯蓉。',
          imageUrl: 'mock/fritters.jpg',
        },
        {
          name: '雞米花',
          price: 50,
          description:
            '由炸雞和米飯製成。有一層脆脆的外皮，裡面是軟嫩的炸雞肉和香甜的米飯。可以配以各種調味料或蘸料，提供額外的口感和風味。',
          imageUrl: 'mock/chicken-fingers.jpg',
        },
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
