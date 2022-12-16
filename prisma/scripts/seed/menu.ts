import { MenuType } from '@prisma/client'

import {
  createMenu,
  createCommodity,
  createCategory,
  addCommodityToMenu,
  createImage,
} from '../../../src/lib/server/database'
import { menuMockData } from './mock'

export default async function seedMenu() {
  // Create main menu
  console.log('>> Seed menu')
  const menu = await createMenu(MenuType.MAIN)
  let mainOrder = 0
  for (const [mainCategoryName, mainCategoryData] of Object.entries(
    menuMockData,
  )) {
    let subOrder = 0
    for (const [subCategoryName, subCategoryData] of Object.entries(
      mainCategoryData.subCategories,
    )) {
      console.log('>> Seed subCategory:', mainCategoryName, subCategoryName)
      const subCategory = await createCategory(
        mainCategoryName,
        subCategoryName,
        mainOrder,
        subOrder,
      )
      for (const commodityData of subCategoryData) {
        console.log('>> Seed commodity:', commodityData.name)
        // Create image
        const image = await createImage(
          640,
          640,
          undefined,
          commodityData.imageUrl,
        )
        // Create commodity
        const commodity = await createCommodity(
          commodityData.name,
          commodityData.price,
          commodityData.description,
          mainCategoryData.optionSets,
          [subCategory.id],
          image.id,
        )
        // Add to menu
        await addCommodityToMenu(commodity.id, menu.id)
      }
      subOrder++
    }
    mainOrder++
  }

  // For empty test
  const commodity = await createCommodity(
    '家齊之吻',
    999,
    '重量級服務，讓您的家人感受到您的溫暖',
    [],
    [],
  )
  await addCommodityToMenu(commodity.id, menu.id)
}
