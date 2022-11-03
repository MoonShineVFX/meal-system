import type { AppRouter } from '@/trpc/server/api/router'
import { httpBatchLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

  return `http://localhost:${process.env.PORT ?? 3000}`
}

const trpc = createTRPCNext<AppRouter>({
  config({ ctx }) {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          // // For SSR
          // headers() {
          //   if (ctx?.req) {
          //     const { connection: _connection, ...headers } = ctx.req.headers
          //     return {
          //       ...headers,
          //       'x-ssr': '1',
          //     }
          //   }
          //   return {}
          // },
        }),
      ],
    }
  },

  ssr: false,
})

export default trpc
