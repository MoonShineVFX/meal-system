import '@/styles/globals.css'
import trpc from '@/trpc/client/client'
import type { AppType } from 'next/app'
import Link from 'next/link'
import UserData from '@/components/UserData'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

const PageApp: AppType = ({ Component, pageProps }) => {
  const queryClient = useQueryClient()

  // Default tanstack query client settings
  useEffect(() => {
    queryClient.setDefaultOptions({
      queries: {
        retry: false,
        refetchOnMount: false,
      },
    })
  }, [])

  return (
    <>
      <div className="flex justify-center gap-8 m-8">
        <Link href="/">home</Link>
        <Link href="/pay">pay</Link>
        <Link href="/recharge">recharge</Link>
        <UserData />
      </div>
      <Component {...pageProps} />
    </>
  )
}

export default trpc.withTRPC(PageApp)
