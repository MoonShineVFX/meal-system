import trpc from '@/trpc/client/client'
import type { AppType } from 'next/app'
import EventListener from '@/components/EventListener'
import AuthListener from '@/components/AuthValidator'
import Menu from '@/components/Menu'
import RouterProgress from '@/components/RouteProgress'
import '@/styles/globals.css'

const PageApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      {/* Main */}
      <div className='mx-auto max-w-lg'>
        <Component {...pageProps} />
      </div>
      {/* Menu */}
      <Menu />
      <RouterProgress />
      <EventListener />
      <AuthListener />
    </>
  )
}

export default trpc.withTRPC(PageApp)
