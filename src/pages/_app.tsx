import type { AppType } from 'next/app'
import { trpc } from '@/utils/trpcClient'

const PageApp: AppType = ({ Component, pageProps }) => {
  return <Component {...pageProps} />
}

export default trpc.withTRPC(PageApp)
