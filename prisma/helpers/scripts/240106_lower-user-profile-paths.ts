import { prismaCient } from '../../../src/lib/server/database'

async function main() {
  console.log('>> Lower user profiles')

  const users = await prismaCient.user.findMany({
    where: {
      profileImageId: {
        not: null,
      },
    },
    select: {
      id: true,
      profileImage: {
        select: {
          id: true,
          path: true,
        },
      },
    },
  })

  // If image path has uppercase letters, lower them
  await Promise.all(
    users
      .filter(
        (user) =>
          user.profileImage?.path !== user.profileImage?.path.toLowerCase(),
      )
      .map(async (user) => {
        await prismaCient.image.update({
          where: {
            id: user.profileImage?.id,
          },
          data: {
            path: user.profileImage?.path.toLowerCase(),
          },
        })
      }),
  )

  console.log('>> Done')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prismaCient.$disconnect()
  })
