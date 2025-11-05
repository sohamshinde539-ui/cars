const CACHE_NAME = '3d-car-showroom-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/browse',
  '/featured',
  '/manifest.json',
  '/_next/static/css/app/layout.css',
  '/images/logo.png',
  '/images/og-image.jpg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) =>
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== CACHE_NAME
            )
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Handle API requests (Prismic)
  if (url.hostname.includes('prismic.io')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for 5 minutes
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Try to serve from cache if network fails
          return caches.match(request)
        })
    )
    return
  }

  // Handle static assets and pages
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          // Return cached version if available
          if (cachedResponse) {
            return cachedResponse
          }

          // Otherwise fetch from network
          return fetch(request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response.ok) {
                return response
              }

              // Cache important responses
              const responseClone = response.clone()
              const shouldCache =
                request.destination === 'script' ||
                request.destination === 'style' ||
                request.destination === 'image' ||
                request.destination === 'font' ||
                url.pathname === '/' ||
                url.pathname.startsWith('/browse') ||
                url.pathname.startsWith('/featured')

              if (shouldCache) {
                caches.open(DYNAMIC_CACHE).then((cache) => {
                  cache.put(request, responseClone)
                })
              }

              return response
            })
            .catch(() => {
              // Offline fallback for HTML pages
              if (request.destination === 'document') {
                return caches.match('/') ||
                  new Response('Offline - Please check your internet connection', {
                    status: 503,
                    statusText: 'Service Unavailable'
                  })
              }

              // For other requests, return a basic offline response
              return new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable'
              })
            })
        })
    )
  }
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Handle any queued offline actions
  // This would integrate with your offline queue system
  console.log('[SW] Background sync completed')
}

// Push notifications (if implemented)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: data.url,
        actions: [
          {
            action: 'view',
            title: 'View Car'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      })
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'view' || !event.action) {
    const url = event.notification.data || '/'

    event.waitUntil(
      clients.matchAll()
        .then((clientList) => {
          // If a client is already focused, use it
          for (const client of clientList) {
            if (client.url === url && 'focus' in client) {
              return client.focus()
            }
          }

          // Otherwise open a new client
          if (clients.openWindow) {
            return clients.openWindow(url)
          }
        })
    )
  }
})

// Cleanup caches periodically
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CACHE_CLEANUP') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          // Keep cache size manageable
          return cache.keys().then((requests) => {
            if (requests.length > 100) {
              // Delete oldest entries
              return Promise.all(
                requests.slice(0, requests.length - 100).map((request) => {
                  return cache.delete(request)
                })
              )
            }
          })
        })
    )
  }
})