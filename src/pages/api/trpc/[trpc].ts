import { createContext } from '@/trpc/app'
import { appRouter } from '@/trpc/api/router'
import * as trpcNext from '@trpc/server/adapters/next'

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
})
