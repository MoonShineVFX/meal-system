import { createContext } from '@/trpc/server/server'
import { appRouter } from '@/trpc/server/api/router'
import * as trpcNext from '@trpc/server/adapters/next'

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
})
