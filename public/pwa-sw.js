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

        switch (payload.type) {
          case 'notification':
            // If the notification is not to be shown when the client is focused, exit early.
            if (
              clientIsFocused &&
              payload.type === 'notification' &&
              payload.data.ignoreIfFocused
            ) {
              return
            }
            const { title, ...options } = payload.data
            options.body = options.message
            self.registration.showNotification(title, {
              ...options,
              renotify: !!options.tag,
              data: {
                url: options.url,
              },
            })
            break
          case 'badge':
            if ('setAppBadge' in navigator !== true) {
              return
            }

            const badgeCount = payload.data
            if (badgeCount > 0) {
              navigator.setAppBadge(badgeCount)
            } else {
              navigator.clearAppBadge()
            }

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
