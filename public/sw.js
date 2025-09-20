// Minimal service worker for installability and offline caching
// Scope: root (served from /sw.js)

const CACHE_NAME = 'dotlist-pwa-v1';
const ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/vite.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? undefined : caches.delete(k))));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // App shell strategy for navigation requests (SPA routes)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put('/index.html', networkResponse.clone());
          return networkResponse;
        } catch {
          const cached = await caches.match('/index.html');
          if (cached) return cached;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })(),
    );
    return;
  }

  // Cache-first for same-origin static assets
  if (url.origin === self.location.origin) {
    const isStaticAsset = /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|gif|svg|webp|ico)$/i.test(
      url.pathname,
    );
    if (isStaticAsset) {
      event.respondWith(
        (async () => {
          const cached = await caches.match(request);
          if (cached) {
            // Update in background
            event.waitUntil(
              (async () => {
                try {
                  const response = await fetch(request);
                  const cache = await caches.open(CACHE_NAME);
                  cache.put(request, response.clone());
                } catch {
                  // ignore
                }
              })(),
            );
            return cached;
          }
          try {
            const response = await fetch(request);
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
            return response;
          } catch (err) {
            return new Response('Offline', { status: 503, statusText: 'Offline' });
          }
        })(),
      );
    }
  }
});

