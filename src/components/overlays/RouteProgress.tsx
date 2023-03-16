import 'nprogress/nprogress.css'
import NProgress from 'nprogress'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useStore } from '@/lib/client/store'

NProgress.configure({ showSpinner: false })
let isLoading = false

export default function RouterProgress() {
  const router = useRouter()
  const addToHistory = useStore((state) => state.addToHistory)

  useEffect(() => {
    const handleRouterStart = () => {
      isLoading = true
      setTimeout(() => {
        if (isLoading) {
          NProgress.start()
        }
      }, 100)
    }
    const handleRouterDone = (url: string) => {
      addToHistory(url)
      NProgress.done()
      isLoading = false
    }
    const handleRouterError = () => {
      NProgress.done()
      isLoading = false
    }
    router.events.on('routeChangeStart', handleRouterStart)
    router.events.on('routeChangeComplete', handleRouterDone)
    router.events.on('routeChangeError', handleRouterError)
    return () => {
      router.events.off('routeChangeStart', handleRouterStart)
      router.events.off('routeChangeComplete', handleRouterDone)
      router.events.off('routeChangeError', handleRouterError)
    }
  }, [])

  return null
}
