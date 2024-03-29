import {
  createMenu,
  createCommodity,
  createCategoryPair,
  addCommodityToMenu,
  createImage,
} from '../../../src/lib/server/database'
import {
  menuMockData,
  reservationsMockMenus,
  reservationsMockData,
} from './mock'

export async function seedMenu() {
  // Create main menu
  console.log('>> Seed menu')
  const menu = await createMenu({ type: 'LIVE' })
  let rootOrder = 0
  for (const [rootCategoryName, rootCategoryData] of Object.entries(
    menuMockData,
  )) {
    let subOrder = 0
    for (const [subCategoryName, subCategoryData] of Object.entries(
      rootCategoryData.subCategories,
    )) {
      console.log('>> Seed subCategory:', rootCategoryName, subCategoryName)
      const subCategory = await createCategoryPair({
        rootName: rootCategoryName,
        subName: subCategoryName,
        rootOrder,
        subOrder,
      })
      for (const commodityData of subCategoryData) {
        console.log('>> Seed commodity:', commodityData.name)
        // Create image
        const image = await createImage({
          width: 640,
          height: 640,
          path: commodityData.imageUrl,
        })
        // Create commodity
        const commodity = await createCommodity({
          name: commodityData.name,
          price: commodityData.price,
          description: commodityData.description,
          optionSets: rootCategoryData.optionSets,
          categoryIds: [subCategory.id],
          imageId: image.id,
        })
        // Add to menu
        await addCommodityToMenu({ commodityId: commodity.id, menuId: menu.id })
      }
      subOrder++
    }
    rootOrder++
  }

  // For empty test
  const commodity = await createCommodity({
    name: '家齊的暴躁',
    price: 999,
    description: '重量級服務，讓您的家人感受到您的溫暖',
  })
  await addCommodityToMenu({ commodityId: commodity.id, menuId: menu.id })
}

export async function seedReservationsMenu() {
  // Seed reservations
  console.log('>> Seed reservations')
  const reservationCommodities: Record<string, number> = {}
  // Create commodity
  for (const [rootCategoryName, rootCategoryData] of Object.entries(
    reservationsMockData,
  )) {
    for (const [subCategoryName, subCategoryData] of Object.entries(
      rootCategoryData.subCategories,
    )) {
      console.log('>> Seed subCategory:', rootCategoryName, subCategoryName)
      const subCategory = await createCategoryPair({
        rootName: rootCategoryName,
        subName: subCategoryName,
      })
      for (const commodityData of subCategoryData) {
        console.log('>> Seed commodity:', commodityData.name)
        // Create image
        const image = await createImage({
          width: 640,
          height: 640,
          path: commodityData.imageUrl,
        })
        // Create commodity
        const commodity = await createCommodity({
          name: commodityData.name,
          price: commodityData.price,
          description: commodityData.description,
          optionSets: rootCategoryData.optionSets,
          categoryIds: [subCategory.id],
          imageId: image.id,
        })
        // Add to dict
        reservationCommodities[commodityData.name] = commodity.id
      }
    }
  }

  // Get next monday
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const menuDate = new Date(
    now.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7) || 7),
  )

  // Create menu and add commodities
  let index = 0
  for (const mealsSets of reservationsMockMenus) {
    console.log('>> Seed reservation menu:', menuDate.toLocaleString())

    const publishedDate = new Date(menuDate)
    publishedDate.setDate(publishedDate.getDate() - 14)
    publishedDate.setHours(10, 0, 0, 0)
    const closedDate = new Date(menuDate)
    closedDate.setDate(closedDate.getDate() - 1)
    closedDate.setHours(18, 0, 0, 0)

    const breakfastMenu = await createMenu({
      type: 'BREAKFAST',
      date: menuDate,
      publishedDate,
      closedDate,
    })
    const lunchMenu = await createMenu({
      type: 'LUNCH',
      date: menuDate,
      publishedDate,
      closedDate,
    })
    const dinnerMenu = await createMenu({
      type: 'DINNER',
      date: menuDate,
      publishedDate,
      closedDate,
    })

    for (const meal of mealsSets[0]) {
      await addCommodityToMenu({
        commodityId: reservationCommodities[meal],
        menuId: breakfastMenu.id,
      })
    }
    for (const meal of mealsSets[1]) {
      await addCommodityToMenu({
        commodityId: reservationCommodities[meal],
        menuId: lunchMenu.id,
      })
    }
    for (const meal of mealsSets[1]) {
      await addCommodityToMenu({
        commodityId: reservationCommodities[meal],
        menuId: dinnerMenu.id,
      })
    }

    if (index === 2) {
      // Tea
      const teaMenu = await createMenu({
        type: 'TEA',
        date: menuDate,
        publishedDate,
        closedDate,
      })
      for (const meal of mealsSets[2]) {
        await addCommodityToMenu({
          commodityId: reservationCommodities[meal],
          menuId: teaMenu.id,
        })
      }
    }

    menuDate.setDate(menuDate.getDate() + 1)
    index++
  }
}
