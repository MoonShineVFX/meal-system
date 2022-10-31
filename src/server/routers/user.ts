import { publicProcedure, router } from '@/server/trpc'
import { prisma } from '@/utils/prismaClient'

export const UserRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    console.log('>>>> ctx', ctx)
    const users = await prisma.user.findMany()
    return users
  }),
  login: publicProcedure.mutation(async () => {
    return {
      token: `token-${Date.now().toString()}`,
    }
  }),
})
