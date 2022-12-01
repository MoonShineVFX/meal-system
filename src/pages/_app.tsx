import type { AppType } from 'next/app'

import trpc from '@/lib/client/trpc'
import { useStore } from '@/lib/client/store'
import EventListener from '@/components/overlays/EventListener'
import AuthValidator from '@/components/overlays/AuthValidator'
import Notification from '@/components/overlays/Notification'
import Navigation from '@/components/overlays/Navigation'
import RouterProgress from '@/components/overlays/RouteProgress'
import '@/styles/globals.css'
import Title from '@/components/Title'

const PageApp: AppType = ({ Component, pageProps }) => {
  const user = useStore((state) => state.user)

  return (
    <>
      <Title />
      {/* Menu */}
      <Navigation />
      {/* Main */}
      <main className='h-full sm:pl-64'>
        <Component {...pageProps} />
      </main>
      {/* Overlay */}
      {user && <EventListener />}
      <RouterProgress />
      <AuthValidator />
      <Notification />
    </>
  )
}

export default trpc.withTRPC(PageApp)
