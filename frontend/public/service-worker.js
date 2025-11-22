// Basic service worker for offline marking queue
const CACHE_NAME = 'late-tracker-cache-v1';
const OFFLINE_URLS = [
  '/',
  '/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first for API, fallback to cache for app shell
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return; // let POST pass through
  if (request.url.includes('/students/mark-late')) return; // allow queue logic in page

  event.respondWith(
    fetch(request).catch(() => caches.match(request).then(r => r || caches.match('/index.html')))
  );
});
