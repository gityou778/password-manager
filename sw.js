const CACHE_NAME = 'vault-cache-v2';
const ASSETS_TO_CACHE = [
  './password-manager.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then(fetchRes => {
        // Only cache local assets, skip extensions/chrome requests
        if(event.request.url.startsWith(self.location.origin)) {
            return caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, fetchRes.clone());
                return fetchRes;
            });
        }
        return fetchRes;
      });
    }).catch(() => {
        // Fallback for offline if not in cache (though everything is in one file)
        return caches.match('./password-manager.html');
    })
  );
});
