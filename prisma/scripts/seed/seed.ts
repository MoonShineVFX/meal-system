import seedUser from './user'
import { seedMenu, seedReservationsMenu } from './menu'

async function main() {
  await seedUser()
  await seedMenu()
  await seedReservationsMenu()
}

main()
