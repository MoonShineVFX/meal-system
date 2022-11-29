import type { AppType } from 'next/app'

import trpc from '@/lib/client/trpc'
import { useStore } from '@/lib/client/store'
import EventListener from '@/components/overlays/EventListener'
import AuthValidator from '@/components/overlays/AuthValidator'
import Notification from '@/components/overlays/Notification'
import Menu from '@/components/overlays/Menu'
import RouterProgress from '@/components/overlays/RouteProgress'
import '@/styles/globals.css'

const PageApp: AppType = ({ Component, pageProps }) => {
  const user = useStore((state) => state.user)

  return (
    <>
      {/* Menu */}
      {user && <Menu />}
      {/* Main */}
      <div className='mx-auto min-h-full max-w-lg'>
        <Component {...pageProps} />
      </div>
      {/* Overlay */}
      <RouterProgress />
      {user && <EventListener />}
      <AuthValidator />
      <Notification />
    </>
  )
}

export default trpc.withTRPC(PageApp)
