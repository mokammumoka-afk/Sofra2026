const CACHE_NAME = 'sufra-pwa-v1.0.2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
];

// Install Event: Cache Core Static Shell & Assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate Event: Clear Stale Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Cleaning old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network First for Page Routes / APIs, Cache First for Static Assets
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Skip non-GET requests or chrome extension schemes
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  // Strategy for Images, CSS, Fonts (Cache First with Network Fallback)
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.url.includes('/icons/') ||
    request.url.includes('_next/static')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch updated in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Strategy for HTML / Document / API Requests (Network First with Cache/Offline Fallback)
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Fallback response for offline navigation
          return new Response(
            `<!DOCTYPE html>
            <html lang="ar" dir="rtl">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>سفرة - وضع عدم الاتصال</title>
                <style>
                  body { font-family: system-ui, sans-serif; background: #faf7f2; color: #1c1917; text-align: center; padding: 3rem 1rem; }
                  .card { background: #ffffff; padding: 2rem; border-radius: 1.5rem; max-width: 420px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e7e5e4; }
                  h1 { color: #ea580c; margin-bottom: 0.5rem; font-size: 1.5rem; }
                  p { color: #78716c; font-size: 0.95rem; line-height: 1.6; }
                  button { background: #ea580c; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: bold; margin-top: 1.5rem; cursor: pointer; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>📡 أنت في وضع عدم الاتصال بالشبكة</h1>
                  <p>تعذر الاتصال بالخادم الآن. يرجى التحقق من تغطية شبكة المدار / ليبيانا أو الواي فاي وإعادة المحاولة.</p>
                  <button onclick="window.location.reload()">إعادة المحاولة 🔄</button>
                </div>
              </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      })
  );
});
