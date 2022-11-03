import '@/styles/globals.css'
import trpc from '@/trpc/client/client'
import type { AppType } from 'next/app'
import Link from 'next/link'
import UserData from '@/components/UserData'
import EventData from '@/components/EventData'

const PageApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <div className="flex justify-center gap-8 m-8">
        <Link href="/">home</Link>
        <Link href="/pay">pay</Link>
        <Link href="/recharge">recharge</Link>
        <UserData />
      </div>
      <Component {...pageProps} />
      <EventData />
    </>
  )
}

export default trpc.withTRPC(PageApp)
