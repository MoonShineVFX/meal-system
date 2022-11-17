import * as trpcNext from '@trpc/server/adapters/next'

import { createContext, appRouter } from '@/lib/trpc'

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
})
