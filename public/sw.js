const CACHE_NAME = 'jarfi-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json',
  '/jarfi_logo_1778350215847.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Exclude API calls and hot-reload requests
  if (event.request.url.includes('/api/') || event.request.url.includes('/_next/webpack-hmr')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Return cached version
        }
        
        // Fetch from network
        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                // Don't cache dynamic pages (like dashboard) too aggressively, but we cache static assets
                if (event.request.url.includes('/_next/') || event.request.url.includes('.png')) {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        ).catch(() => {
          // Fallback if offline
        });
      })
  );
});
