const CACHE_NAME = 'banco-de-cifras-cache-v1';
const urlsToCache = [
  '/',
  '/index.html'
  // Adicione aqui outros arquivos se tiver (ex: '/style.css')
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});