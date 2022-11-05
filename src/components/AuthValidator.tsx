import trpc from '@/trpc/client/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

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

  return null
}
