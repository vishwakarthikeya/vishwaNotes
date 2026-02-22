// ========== service-worker.js ==========
const CACHE_NAME = 'calm-notes-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/pin-auth.js',
  '/github-sync.js',
  '/manifest.json',
  '/assets/default-cover.jpg' // you should place a placeholder
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});