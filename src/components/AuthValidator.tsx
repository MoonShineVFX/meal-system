import { useRouter } from 'next/router'
import { atom, useSetAtom } from 'jotai'
import { User } from '@prisma/client'

import Spinner from '@/components/Spinner'
import trpc from '@/lib/client/trpc'

/* State */
export const userAtom = atom<User | null>(null)

/* Component */
export default function AuthValidator() {
  const router = useRouter()
  const setUser = useSetAtom(userAtom)
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
      <div className='fixed inset-0 z-50 grid place-items-center bg-amber-400'>
        <div className='flex items-center gap-2 text-lg tracking-widest'>
          <Spinner className='h-5 w-5' />
          身分驗證中
        </div>
      </div>
    )

  return null
}
