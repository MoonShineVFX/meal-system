import type { AppType } from 'next/app'
import { useAtomValue } from 'jotai'

import trpc from '@/lib/client/trpc'
import EventListener from '@/components/EventListener'
import AuthValidator, { userAtom } from '@/components/AuthValidator'
import Notification from '@/components/Notification'
import Menu from '@/components/Menu'
import RouterProgress from '@/components/RouteProgress'
import '@/styles/globals.css'

const PageApp: AppType = ({ Component, pageProps }) => {
  const user = useAtomValue(userAtom)

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
      {user && <EventListener />}
      <AuthValidator />
      <Notification />
    </>
  )
}

export default trpc.withTRPC(PageApp)
