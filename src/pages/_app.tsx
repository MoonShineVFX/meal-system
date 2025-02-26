import type { AppType } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { NuqsAdapter } from 'nuqs/adapters/next/pages'
import { twMerge } from 'tailwind-merge'

import Title from '@/components/core/Title'
import AuthValidator from '@/components/overlays/AuthValidator'
import EventListener from '@/components/overlays/EventListener'
import Navigation from '@/components/overlays/Navigation'
import Notification from '@/components/overlays/Notification'
import RouterProgress from '@/components/overlays/RouteProgress'
import trpc from '@/lib/client/trpc'
import '@/styles/globals.css'

const FULLSCREEN_COMPONENT_PATHS = ['/login']

const PageApp: AppType = ({ Component, pageProps }) => {
  const router = useRouter()
  const isComponentFullscreen = FULLSCREEN_COMPONENT_PATHS.includes(
    router.pathname,
  )

  return (
    <NuqsAdapter>
      <Head>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0, viewport-fit=cover'
        />
      </Head>
      <Title />
      {/* Content */}
      <div className='grid h-full grid-rows-[auto_calc(4rem_+_env(safe-area-inset-bottom))] sm:grid-cols-[14rem_auto] sm:grid-rows-none lg:grid-cols-[15rem_auto]'>
        <nav
          className={twMerge(
            'order-last sm:order-none',
            isComponentFullscreen && 'hidden',
          )}
        >
          <Navigation />
        </nav>
        <main
          className={twMerge(
            '@container/main',
            isComponentFullscreen && 'col-span-full row-span-full',
          )}
        >
          <Component {...pageProps} />
        </main>
      </div>
      {/* Overlay */}
      <EventListener />
      <RouterProgress />
      <AuthValidator />
      <Notification />
    </NuqsAdapter>
  )
}

export default trpc.withTRPC(PageApp)
