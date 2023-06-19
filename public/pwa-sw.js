self.addEventListener('install', () => {
  self.skipWaiting()
  console.log('PWA Service Worker Installed')
})

self.addEventListener('fetch', () => {})

self.addEventListener('push', (event) => {
  const payload = event.data.json()
  const promiseChain = self.registration.showNotification(
    payload.title,
    payload.options,
  )
  event.waitUntil(promiseChain)
})
