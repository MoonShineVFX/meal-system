import type { AppType } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { twMerge } from 'tailwind-merge'
import { useEffect } from 'react'

import trpc from '@/lib/client/trpc'
import EventListener from '@/components/overlays/EventListener'
import AuthValidator from '@/components/overlays/AuthValidator'
import Notification from '@/components/overlays/Notification'
import Navigation from '@/components/overlays/Navigation'
import RouterProgress from '@/components/overlays/RouteProgress'
import '@/styles/globals.css'
import Title from '@/components/core/Title'
import { useStore } from '@/lib/client/store'

const FULLSCREEN_COMPONENT_PATHS = ['/login']

const PageApp: AppType = ({ Component, pageProps }) => {
  const router = useRouter()
  const isComponentFullscreen = FULLSCREEN_COMPONENT_PATHS.includes(
    router.pathname,
  )
  const setServiceWorkerRegistration = useStore(
    (state) => state.setServiceWorkerRegistration,
  )

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/pwa-sw.js').then((reg) => {
        console.log('Service worker registered', reg)
        setServiceWorkerRegistration(reg)
      })
    }
  }, [])

  return (
    <>
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
    </>
  )
}

export default trpc.withTRPC(PageApp)
