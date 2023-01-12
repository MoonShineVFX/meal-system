import { staffProcedure, router } from '../trpc'
import { getCommodities } from '@/lib/server/database'

export const CommodityRouter = router({
  get: staffProcedure.query(async () => {
    return await getCommodities()
  }),
})
