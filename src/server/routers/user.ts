import { z } from 'zod'
import { publicProcedure, router } from '@/server/trpc'
import { prisma } from '@/utils/prismaClient'

export const UserRouter = router({
  list: publicProcedure.query(async () => {
    const users = await prisma.user.findMany()
    return users
  }),
})
