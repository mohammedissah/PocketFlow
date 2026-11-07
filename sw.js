// PocketFlow Service Worker v3.7 (WebAPK PWA with Supabase Cloud Sync)
const CACHE_NAME = 'pocketflow-cache-v3.7';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './pocketflow_spending_tracker.html',
    './manifest.json',
    './manifest.webmanifest',
    './og-image.png',
    './logo.png',
    './logo.jpg',
    './logo-512.png',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable-192.png',
    './icon-maskable-512.png',
    './apple-touch-icon.png',
    './apple-touch-icon-180x180.png',
    './apple-touch-icon-152x152.png',
    './apple-touch-icon-167x167.png',
    './apple-touch-icon-120x120.png',
    './favicon.png',
    './favicon.ico'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const isNavigation = event.request.mode === 'navigate' || 
                         (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

    // 1. Navigation / HTML Document requests: Network-First (Allows live refresh in browser & offline fallback in PWA)
    if (isNavigation) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request).then((cachedResponse) => {
                        return cachedResponse || caches.match('./index.html') || caches.match('./');
                    });
                })
        );
        return;
    }

    // 2. Static Assets: Stale-While-Revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});

// Native Push / System Notifications (Required on iOS 16.4+ and Android)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./');
            }
        })
    );
});
