import type { AppType } from 'next/app'

import trpc from '@/lib/client/trpc'
import { useStore } from '@/lib/client/store'
import EventListener from '@/components/overlays/EventListener'
import AuthValidator from '@/components/overlays/AuthValidator'
import Notification from '@/components/overlays/Notification'
import Navigation from '@/components/overlays/Navigation'
import RouterProgress from '@/components/overlays/RouteProgress'
import '@/styles/globals.css'
import Title from '@/components/core/Title'

const PageApp: AppType = ({ Component, pageProps }) => {
  const user = useStore((state) => state.user)

  return (
    <>
      <Title />
      <div className='grid h-full grid-rows-[auto_64px] sm:grid-cols-[256px_auto] sm:grid-rows-none'>
        <nav className='order-last sm:order-none'>
          <Navigation />
        </nav>
        <main>
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
