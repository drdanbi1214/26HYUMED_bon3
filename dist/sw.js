self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(data.title || '일실기 알림', {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: self.location.origin },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'))
})
