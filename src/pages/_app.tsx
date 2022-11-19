import type { AppType } from 'next/app'

import trpc from '@/lib/client/trpc'
import EventListener from '@/components/EventListener'
import AuthListener from '@/components/AuthValidator'
import Notification from '@/components/Notification'
import Menu from '@/components/Menu'
import RouterProgress from '@/components/RouteProgress'
import '@/styles/globals.css'

const PageApp: AppType = ({ Component, pageProps }) => {
  const userInfoQuery = trpc.user.info.useQuery(undefined)

  return (
    <>
      {/* Main */}
      <div className='mx-auto max-w-lg'>
        <Component {...pageProps} />
      </div>
      {/* Menu */}
      <Menu />
      {/* Overlay */}
      <RouterProgress />
      {userInfoQuery.data && <EventListener />}
      <AuthListener />
      <Notification />
    </>
  )
}

export default trpc.withTRPC(PageApp)
