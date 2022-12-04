import seedUser from './user'
import seedMenu from './menu'

async function main() {
  await seedUser()
  await seedMenu()
}

main()
