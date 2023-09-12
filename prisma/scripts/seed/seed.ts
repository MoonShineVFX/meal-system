import seedUser from './user'
import { seedMenu, seedReservationsMenu } from './menu'
import { seedLiveOrders } from './order'

async function main() {
  // await seedUser()
  // await seedMenu()
  // await seedReservationsMenu()
  await seedLiveOrders()
}

main()
