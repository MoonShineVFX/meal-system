import '@/styles/globals.css'
import trpc from '@/trpc/client/client'
import type { AppType } from 'next/app'
import Link from 'next/link'
import UserData from '@/components/UserData'
import EventListener from '@/components/EventListener'
import AuthListener from '@/components/AuthListener'

const PageApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <div className="flex justify-center gap-8 m-8">
        <Link href="/">home</Link>
        <Link href="/pay">pay</Link>
        <Link href="/recharge">recharge</Link>
        <Link href="/records">records</Link>
        <Link href="/staffRecords">records(staff)</Link>
        <Link href="/adminRecords">records(admin)</Link>
        <UserData />
      </div>
      <Component {...pageProps} />
      <EventListener />
      <AuthListener />
    </>
  )
}

export default trpc.withTRPC(PageApp)
