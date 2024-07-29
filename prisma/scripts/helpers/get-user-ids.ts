import { prismaCient } from '../../../src/lib/server/database'

async function main() {
  const userIds = await prismaCient.user
    .findMany({
      select: {
        id: true,
      },
    })
    .then((users) => users.map((user) => user.id))

  // console.log all with json array
  console.log(JSON.stringify(userIds, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prismaCient.$disconnect()
  })
