import type { AppType } from 'next/app'
import { useRouter } from 'next/router'
import { twMerge } from 'tailwind-merge'

import trpc from '@/lib/client/trpc'
import { useStore } from '@/lib/client/store'
import EventListener from '@/components/overlays/EventListener'
import AuthValidator from '@/components/overlays/AuthValidator'
import Notification from '@/components/overlays/Notification'
import Navigation from '@/components/overlays/Navigation'
import RouterProgress from '@/components/overlays/RouteProgress'
import '@/styles/globals.css'
import Title from '@/components/core/Title'

const FULLSCREEN_COMPONENT_PATHS = ['/login']

const PageApp: AppType = ({ Component, pageProps }) => {
  const user = useStore((state) => state.user)
  const router = useRouter()
  const isComponentFullscreen = FULLSCREEN_COMPONENT_PATHS.includes(
    router.pathname,
  )

  return (
    <>
      <Title />
      {/* Content */}
      <div className='grid h-full grid-rows-[auto_4rem] sm:grid-cols-[15rem_auto] sm:grid-rows-none'>
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
      {user && <EventListener />}
      <RouterProgress />
      <AuthValidator />
      <Notification />
    </>
  )
}

export default trpc.withTRPC(PageApp)
