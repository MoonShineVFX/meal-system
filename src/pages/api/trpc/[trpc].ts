import * as trpcNext from '@trpc/server/adapters/next'

import { appRouter } from '@/lib/trpc/api/router'
import { createContext } from '@/lib/trpc/trpc'

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
  batching: {
    enabled: true,
  },
})
