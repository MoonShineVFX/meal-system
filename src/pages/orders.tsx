import { useAuth } from '@/utils/hooks'

export default function PageOrders() {
  const user = useAuth()

  if (user.status === 'error') return <div>Error: {user.error.message}</div>
  if (user.status === 'loading') return <div>Loading...</div>

  return (
    <>
      <h1 className="text-center text-3xl">{user.data.name}</h1>
    </>
  )
}
