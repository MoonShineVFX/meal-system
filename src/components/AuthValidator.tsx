import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Spinner from '@/components/Spinner'
import trpc from '@/trpc/client/client'

export default function AuthListener() {
  const userInfoQuery = trpc.user.info.useQuery(undefined)
  const router = useRouter()
  const [pathBeforeLogin, setPathBeforeLogin] = useState<string | null>(null)

  useEffect(() => {
    // If the user is not logged in, redirect to the login page
    if (userInfoQuery.status === 'error' && router.pathname !== '/login') {
      setPathBeforeLogin(router.pathname)
      router.push('/login')
    }

    // If the user is logged in, redirect to the page before login
    if (userInfoQuery.status === 'success' && router.pathname === '/login') {
      if (pathBeforeLogin) {
        router.push(pathBeforeLogin)
      } else {
        router.push('/')
      }
    }
  }, [userInfoQuery.status, router.pathname])

  if (userInfoQuery.status !== 'success' && router.pathname !== '/login')
    return (
      <div className='fixed inset-0 z-50 grid place-items-center bg-amber-400'>
        <div className='flex items-center gap-2 text-lg tracking-widest'>
          <Spinner className='h-5 w-5' />
          會員驗證中
        </div>
      </div>
    )

  return null
}
