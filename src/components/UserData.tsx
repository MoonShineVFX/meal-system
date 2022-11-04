import trpc from '@/trpc/client/client'
import { generateCookie } from '@/utils/settings'

export default function UserData() {
  const userInfoQuery = trpc.user.info.useQuery(undefined)
  const trpcContext = trpc.useContext()

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
