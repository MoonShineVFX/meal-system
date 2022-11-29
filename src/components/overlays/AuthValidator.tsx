import { useRouter } from 'next/router'

import Spinner from '@/components/Spinner'
import trpc from '@/lib/client/trpc'
import { useStore } from '@/lib/client/store'

/* Component */
export default function AuthValidator() {
  const router = useRouter()
  const setUser = useStore((state) => state.setUser)
  const userInfoQuery = trpc.user.info.useQuery(undefined, {
    onSuccess(data) {
      setUser(data)
      if (router.pathname === '/login') {
        router.push('/')
      }
    },
    onError() {
      setUser(null)
      if (router.pathname !== '/login') {
        router.push('/login')
      }
    },
  })

  if (userInfoQuery.status !== 'success' && router.pathname !== '/login')
    return (
      <div className='fixed inset-0 z-50 grid place-items-center bg-violet-700'>
        <div className='flex items-center gap-2 text-gray-900'>
          <Spinner className='h-5 w-5' />
          <p className='text-lg font-bold tracking-widest'>身分驗證中</p>
        </div>
      </div>
    )

  return null
}
