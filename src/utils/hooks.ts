import trpc from '@/utils/trpc'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export function useAuth() {
  const user = trpc.user.info.useQuery(undefined, { retry: false })
  const router = useRouter()

  useEffect(() => {
    if (user.status === 'error') router.push('/login')
  }, [user.status])

  return user
}
