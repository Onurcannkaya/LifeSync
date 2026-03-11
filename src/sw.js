const CACHE_NAME = 'lifesync-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/auth.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/modals.css',
  '/css/calendar.css',
  '/css/kanban.css',
  '/css/network.css',
  '/css/archive.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/utils/supabase.js',
  '/js/utils/store.js',
  '/js/render/today.js',
  '/js/render/calendar.js',
  '/js/render/workspace.js',
  '/js/render/network.js',
  '/js/render/archive.js',
  '/manifest.json'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      // We use addAll but catch errors if some assets fail to load
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url).catch(err => console.error(`[SW] Failed to cache ${url}:`, err)))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Cache First, fallback to Network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (like Supabase API or APIs)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip supabase auth requests
  if (event.request.url.includes('supabase.co')) {
      return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Don't cache non-successful responses or non-GET requests
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' || event.request.method !== 'GET') {
          return networkResponse;
        }

        // Cache the newly fetched response
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((error) => {
        console.error('[Service Worker] Fetch failed:', error);
        // Serve offline fallback if requesting a document
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        throw error;
      });
    })
  );
});
