// PocketFlow Automatic Cache Killer & Service Worker Reset
// Wipes all cached versions and unregisters from all devices

self.addEventListener('install', (event) => {
    // Force immediate takeover
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        // 1. Delete EVERY cache in CacheStorage
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    return caches.delete(key);
                })
            );
        }).then(() => {
            // 2. Claim all open browser windows / tabs
            return self.clients.claim();
        }).then(() => {
            // 3. Unregister this service worker registration so it never runs again
            return self.registration.unregister();
        }).then(() => {
            // 4. Force all open clients to reload fresh from the network
            return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        }).then((clients) => {
            for (const client of clients) {
                if (client.url && 'navigate' in client) {
                    client.navigate(client.url);
                }
            }
        })
    );
});

// Network-only fallback: never intercept or serve stale cache during shutdown
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});
