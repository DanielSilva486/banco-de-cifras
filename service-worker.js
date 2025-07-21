const CACHE_NAME = 'banco-de-cifras-cache-v1';
const urlsToCache = [
  '/',
  '/index.html'
  // Adicione aqui outros arquivos estáticos se tiver (ex: '/style.css')
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Estratégia para a API do Google Scripts (Network-first, then cache)
  if (requestUrl.protocol === 'https:' && requestUrl.hostname === 'script.google.com') {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Se a resposta da rede for bem-sucedida, armazena no cache
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return networkResponse;
        })
        .catch(() => {
          // Se a rede falhar, tenta buscar do cache
          return caches.match(event.request);
        })
    );
  } else {
    // Estratégia para os arquivos locais do app (Cache-first)
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Retorna do cache se encontrar, senão busca na rede
          return response || fetch(event.request);
        })
    );
  }
});