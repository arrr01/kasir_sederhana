// Service Worker for Bengkel POS offline PWA
const CACHE_NAME = 'bengkel-pos-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/pos.js',
  './js/storage.js',
  // add any other assets you use (fonts, images)
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', event => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request).then(resp => resp || caches.match('./index.html')))
  );
});
