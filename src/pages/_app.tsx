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
      <div className='mx-auto grid grid-cols-1 md:grid-cols-[12rem_1fr]'>
        {/* Menu */}
        <Menu />
        <div className='hidden md:block'></div>
        {/* Main */}
        <div className='flex w-full justify-center md:h-screen md:overflow-y-auto md:px-8'>
          <div className='relative mx-auto w-full max-w-2xl'>
            <Component {...pageProps} />
          </div>
        </div>
      </div>
      <RouterProgress />
      <EventListener />
      <AuthListener />
    </>
  )
}

export default trpc.withTRPC(PageApp)
