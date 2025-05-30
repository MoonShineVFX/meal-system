import { router } from '../trpc'
import { UserRouter } from './user'
import { TransactionRouter } from './transaction'
import { MenuRouter } from './menu'
import { CartRouter } from './cart'
import { OrderRouter } from './order'
import { POSRouter } from './pos'
import { CategoryRouter } from './category'
import { CommodityRouter } from './commodity'
import { OptionSetRouter } from './optionSet'
import { ImageRouter } from './image'
import { DepositRouter } from './deposit'
import { SupplierRouter } from './supplier'
import { BonusRouter } from './bonus'

export const appRouter = router({
  user: UserRouter,
  transaction: TransactionRouter,
  menu: MenuRouter,
  cart: CartRouter,
  order: OrderRouter,
  pos: POSRouter,
  category: CategoryRouter,
  commodity: CommodityRouter,
  optionSet: OptionSetRouter,
  image: ImageRouter,
  deposit: DepositRouter,
  supplier: SupplierRouter,
  bonus: BonusRouter,
})

export type AppRouter = typeof appRouter

