self.addEventListener('install', () => {
  self.skipWaiting()
  console.debug('PWA Service Worker Installed')
})

self.addEventListener('fetch', () => {})

self.addEventListener('push', (event) => {
  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
      })
      .then((clientList) => {
        return clientList.some(
          (client) => 'focused' in client && client.focused,
        )
      })
      .then((clientIsFocused) => {
        payload = event.data.json()

        // If the notification is not to be shown when the client is focused, exit early.
        if (
          clientIsFocused &&
          payload.type === 'notification' &&
          payload.data.ignoreIfFocused
        ) {
          return
        }

        switch (payload.type) {
          case 'notification':
            const { title, ...options } = payload.data
            options.body = options.message
            promiseChain = self.registration.showNotification(title, {
              ...options,
              renotify: !!options.tag,
              data: {
                url: options.url,
              },
            })
            break
          case 'badge':
            break
        }
      }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients
        .matchAll({
          type: 'window',
        })
        .then((clientList) => {
          for (const client of clientList) {
            if ('focus' in client) {
              return client.focus()
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data.url)
          }
        }),
    )
  }
})
