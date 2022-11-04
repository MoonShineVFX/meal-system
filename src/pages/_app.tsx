import '@/styles/globals.css'
import trpc from '@/trpc/client/client'
import type { AppType } from 'next/app'
import EventListener from '@/components/EventListener'
import AuthListener from '@/components/AuthListener'
import Menu from '@/components/Menu'

const PageApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Component {...pageProps} />
      <Menu />
      <EventListener />
      <AuthListener />
    </>
  )
}

export default trpc.withTRPC(PageApp)
