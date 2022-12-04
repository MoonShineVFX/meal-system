import { MenuType } from '@prisma/client'
import { faker } from '@faker-js/faker/locale/zh_TW'

import {
  createMenu,
  readMenu,
  deleteMenu,
  createCommodity,
  createSubCategory,
  addCommodityToMenu,
} from '@/lib/server/database'
import { menuMockData } from './mock'

export default async function seedMenu() {
  // Create main menu
  let menu = await readMenu(MenuType.MAIN)
  if (menu) {
    await deleteMenu(menu.id)
  }
  console.log('>> Seed menu')
  menu = await createMenu(MenuType.MAIN)

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
        // Create commodity
        const commodity = await createCommodity(
          commodityData.name,
          commodityData.price,
          faker.commerce.productDescription(),
          mainCategoryData.optionSets,
          subCategory.id,
          faker.image.food(640, 480),
        )
        // Add to menu
        await addCommodityToMenu(commodity.id, menu.id)
      }
    }
  }
}
