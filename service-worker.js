const CACHE_NAME = 'determinador-cache-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Instalación del Service Worker: se abre la caché y se añaden los archivos base.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// Evento fetch: responde con los assets desde la caché si están disponibles.
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si la respuesta está en la caché, la devuelve.
                if (response) {
                    return response;
                }
                // Si no, la busca en la red.
                return fetch(event.request);
            })
    );
});

// Evento activate: limpia las cachés antiguas para mantener la app actualizada.
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});