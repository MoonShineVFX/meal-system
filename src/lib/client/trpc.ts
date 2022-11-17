import { httpBatchLink } from '@trpc/client'
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
