import { staffProcedure, router } from '../trpc'
import { getCommodities } from '@/lib/server/database'
// import z from 'zod'

export const CommodityRouter = router({
  // create: staffProcedure
  //   .input(z.object({
  //     name: z.string(),
  //     price: z.number(),
  //     description: z.string().optional(),
  //     optionSets: z.array(z.object({
  //       name: z.string(),
  //       multiselect: z.boolean(),
  //       options: z.array(z.string()),
  //       order: z.number(),
  //     })).optional(),
  //     categoryIds: z.array(z.number()).optional(),
  //     imageId: z.string().optional(),

  //   }))
  get: staffProcedure.query(async () => {
    return await getCommodities()
  }),
})
