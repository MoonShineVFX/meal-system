import 'nprogress/nprogress.css'
import NProgress from 'nprogress'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

NProgress.configure({ showSpinner: false })
let isLoading = false

export default function RouterProgress() {
  const router = useRouter()

  useEffect(() => {
    const handleRouterStart = () => {
      isLoading = true
      setTimeout(() => {
        if (isLoading) {
          NProgress.start()
        }
      }, 100)
    }
    const handleRouterDone = () => {
      NProgress.done()
      isLoading = false
    }
    router.events.on('routeChangeStart', handleRouterStart)
    router.events.on('routeChangeComplete', handleRouterDone)
    router.events.on('routeChangeError', handleRouterDone)
    return () => {
      router.events.off('routeChangeStart', handleRouterStart)
      router.events.off('routeChangeComplete', handleRouterDone)
      router.events.off('routeChangeError', handleRouterDone)
    }
  }, [])

  return null
}
