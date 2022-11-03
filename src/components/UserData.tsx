import trpc from '@/trpc/client/client'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { generateCookie } from '@/utils/settings'

export default function UserData() {
  const userInfoQuery = trpc.user.info.useQuery(undefined)
  const router = useRouter()
  const trpcContext = trpc.useContext()

  // If the user is not logged in, redirect to the login page
  useEffect(() => {
    if (userInfoQuery.status === 'error' && router.pathname !== '/login')
      router.push('/login')
  }, [userInfoQuery.status, router.pathname])

  const handleLogout = () => {
    document.cookie = generateCookie(undefined) // Remove the cookie
    trpcContext.user.info.invalidate()
  }

  if (userInfoQuery.status === 'success')
    return (
      <div>
        <div
          className="p-1 border-2 mb-2 cursor-pointer"
          onClick={handleLogout}
        >
          logout
        </div>
        <div>points: {userInfoQuery.data.points}</div>
        <div>credits: {userInfoQuery.data.credits}</div>
      </div>
    )

  return <div>loading</div>
}
