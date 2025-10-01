const CACHE_NAME = 'determinador-cache-v31'; // Salto de versión para forzar actualización
const URLS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// Instala el Service Worker y guarda los archivos base en la caché.
self.addEventListener('install', event => {
    console.log('[Service Worker] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Archivos guardados en caché');
                return cache.addAll(URLS_TO_CACHE);
            })
            .catch(error => {
                console.error('[Service Worker] Falló la instalación de la caché', error);
            })
    );
    self.skipWaiting();
});

// Activa el Service Worker y limpia las cachés antiguas.
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activando...');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('[Service Worker] Borrando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Intercepta las peticiones de red. Estrategia: Cache First.
// Primero busca en la caché, si no lo encuentra, va a la red.
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    // Si está en caché, lo sirve desde ahí.
                    return response;
                }
                // Si no, lo busca en la red.
                return fetch(event.request);
            })
    );
});
