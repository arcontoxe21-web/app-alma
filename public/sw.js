const CACHE_NAME = 'alma-elite-v3';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './main.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './logo-alma.png'
];

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate Event: Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Network first, fall back to cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
    );
});
