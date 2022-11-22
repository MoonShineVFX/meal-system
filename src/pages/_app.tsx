import type { AppType } from 'next/app'

import trpc from '@/lib/client/trpc'
import { useStore } from '@/lib/client/store'
import EventListener from '@/components/EventListener'
import AuthValidator from '@/components/AuthValidator'
import Notification from '@/components/Notification'
import Menu from '@/components/Menu'
import RouterProgress from '@/components/RouteProgress'
import '@/styles/globals.css'

const PageApp: AppType = ({ Component, pageProps }) => {
  const user = useStore((state) => state.user)

  return (
    <>
      {/* Main */}
      <div className='mx-auto min-h-full max-w-lg'>
        <Component {...pageProps} />
      </div>
      {/* Menu */}
      <Menu />
      {/* Overlay */}
      <RouterProgress />
      {user && <EventListener />}
      <AuthValidator />
      <Notification />
    </>
  )
}

export default trpc.withTRPC(PageApp)
