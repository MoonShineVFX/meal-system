import trpc from '@/utils/trpc'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { generateCookie } from '@/utils/settings'

export default function UserData() {
  const user = trpc.user.info.useQuery(undefined, { retry: false })
  const router = useRouter()
  const trpcContext = trpc.useContext()

  // If the user is not logged in, redirect to the login page
  useEffect(() => {
    if (user.status === 'error' && router.pathname !== '/login')
      router.push('/login')
  }, [user.status, router.pathname])

  const handleLogout = () => {
    document.cookie = generateCookie(undefined) // Remove the cookie
    trpcContext.user.info.invalidate()
  }

  if (user.status === 'success')
    return (
      <div>
        <div
          className="p-1 border-2 mb-2 cursor-pointer"
          onClick={handleLogout}
        >
          logout
        </div>
        <div>points: {user.data.points}</div>
        <div>credits: {user.data.credits}</div>
      </div>
    )

  return <div>loading</div>
}
