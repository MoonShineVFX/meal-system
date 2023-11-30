import { prismaCient } from '../../../src/lib/server/database'

// Prevent dev data to notify users
async function main() {
  console.log('>> Remove user tokens')

  const result = await prismaCient.userToken.deleteMany({})

  console.log(`Removed ${result.count} user tokens`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prismaCient.$disconnect()
  })
