import { createContext } from '@/trpc/init'
import { appRouter } from '@/trpc/routers/router'
import * as trpcNext from '@trpc/server/adapters/next'

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
})
