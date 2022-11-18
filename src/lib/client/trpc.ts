import { httpBatchLink, loggerLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import superjson from 'superjson'

import type { AppRouter } from '@/lib/trpc'

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  return `http://localhost:${process.env.PORT ?? 3000}`
}

const trpc = createTRPCNext<AppRouter>({
  config({ ctx }) {
    return {
      links: [
        loggerLink({
          enabled: (opts) =>
            (process.env.NODE_ENV !== 'production' &&
              typeof window !== 'undefined') ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
      transformer: superjson,
      queryClientConfig: {
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      },
    }
  },

  ssr: false,
})

export default trpc
