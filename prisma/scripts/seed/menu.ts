import { MenuType } from '@prisma/client'

import {
  createMenu,
  createCommodity,
  createSubCategory,
  addCommodityToMenu,
  createImage,
} from '../../../src/lib/server/database'
import { menuMockData } from './mock'

export default async function seedMenu() {
  // Create main menu
  console.log('>> Seed menu')
  const menu = await createMenu(MenuType.MAIN)

  for (const [mainCategoryName, mainCategoryData] of Object.entries(
    menuMockData,
  )) {
    for (const [subCategoryName, subCategoryData] of Object.entries(
      mainCategoryData.subCategories,
    )) {
      console.log('>> Seed subCategory:', mainCategoryName, subCategoryName)
      const subCategory = await createSubCategory(
        mainCategoryName,
        subCategoryName,
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
          subCategory.id,
          image.id,
        )
        // Add to menu
        await addCommodityToMenu(commodity.id, menu.id)
      }
    }
  }
}
