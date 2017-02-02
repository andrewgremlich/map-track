var staticCacheName = 'maptrackPWA-v1',
    filesToCache = [
        '/index.html',
        '/dist/scripts.js',
        '/dist/styles.css',
        'favicon.ico',
        'manifest.json'
    ];

self.addEventListener('install', function (e) {
    console.log('Installing Service Worker');
    e.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('wittr-') && cacheName != staticCacheName;
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    // TODO: respond to requests for the root page with
    // the page skeleton from the cache

    var requestURL = new URL(event.request.url)

    if (requestURL.origin === location.origin) {
        if (requestURL.pathname === '/') {
            event.respondWith(caches.match('/index.html'))
            return
        }
    }

    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});
