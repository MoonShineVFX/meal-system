import { prismaCient } from '../../../src/lib/server/database'

async function main() {
  const menuId = 1 // live
  console.log('>> Restore menu:', menuId)

  await prismaCient.commodityOnMenu.updateMany({
    where: {
      menuId: menuId,
    },
    data: {
      isDeleted: false,
    },
  })

  await prismaCient.menu.update({
    where: {
      id: menuId,
    },
    data: {
      isDeleted: false,
    },
  })

  console.log('>> Restore menu:', menuId, 'done')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prismaCient.$disconnect()
  })
