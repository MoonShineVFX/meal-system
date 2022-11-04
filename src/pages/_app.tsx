import '@/styles/globals.css'
import trpc from '@/trpc/client/client'
import type { AppType } from 'next/app'
import EventListener from '@/components/EventListener'
import AuthListener from '@/components/AuthListener'
import Menu from '@/components/Menu'

const PageApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <div className='grid max-w-6xl grid-cols-1 md:grid-cols-[12rem_1fr]'>
        <Menu />
        <div>
          <Component {...pageProps} />
        </div>
      </div>
      <EventListener />
      <AuthListener />
    </>
  )
}

export default trpc.withTRPC(PageApp)
