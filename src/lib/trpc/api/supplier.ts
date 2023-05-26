import { staffProcedure, router } from '../trpc'
import { getSuppliers } from '@/lib/server/database'

export const SupplierRouter = router({
  getList: staffProcedure.query(async () => {
    return await getSuppliers()
  }),
})
