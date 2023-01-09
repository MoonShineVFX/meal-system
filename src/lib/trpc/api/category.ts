import { staffProcedure, router } from '../trpc'
import { getCategories } from '@/lib/server/database'

export const CategoryRouter = router({
  get: staffProcedure.query(async () => {
    return await getCategories()
  }),
})
