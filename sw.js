const CACHE_NAME = 'whot-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './manifest.json',
  './icons/icon-48.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './resources/circle.png',
  './resources/cross.png',
  './resources/reverse.png',
  './resources/square.png',
  './resources/star.png',
  './resources/triangle.png',
  './resources/whot.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).catch(() =>
        new Response('Offline – please reconnect to play.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        })
      );
    })
  );
});
