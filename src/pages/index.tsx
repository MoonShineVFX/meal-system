import { trpc } from '@/utils/trpcClient'

export default function PageIndex() {
  const userList = trpc.user.list.useQuery()

  if (!userList.data) return <div>Loading...</div>

  return (
    <>
      {userList.data.map((user) => (
        <div key={user.id}>
          <h1>{user.name}</h1>
          <div>{user.role}</div>
          <div>{user.points}</div>
        </div>
      ))}
    </>
  )
}
