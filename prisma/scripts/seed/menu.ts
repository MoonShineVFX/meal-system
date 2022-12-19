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
  const menu = await createMenu({ type: 'MAIN' })
  let mainOrder = 0
  for (const [mainCategoryName, mainCategoryData] of Object.entries(
    menuMockData,
  )) {
    let subOrder = 0
    for (const [subCategoryName, subCategoryData] of Object.entries(
      mainCategoryData.subCategories,
    )) {
      console.log('>> Seed subCategory:', mainCategoryName, subCategoryName)
      const subCategory = await createCategory({
        mainName: mainCategoryName,
        subName: subCategoryName,
        mainOrder,
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
          optionSets: mainCategoryData.optionSets,
          categoryIds: [subCategory.id],
          imageId: image.id,
        })
        // Add to menu
        await addCommodityToMenu({ commodityId: commodity.id, menuId: menu.id })
      }
      subOrder++
    }
    mainOrder++
  }

  // For empty test
  const commodity = await createCommodity({
    name: '家齊之吻',
    price: 999,
    description: '重量級服務，讓您的家人感受到您的溫暖',
  })
  await addCommodityToMenu({ commodityId: commodity.id, menuId: menu.id })
}
