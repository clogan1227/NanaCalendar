const IMAGE_CACHE_NAME = "firebase-image-cache-v1";

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "CACHE_IMAGES") {
        const urlsToCache = event.data.payload;

        event.waitUntil(
            (async () => {
                const cache = await caches.open("firebase-image-cache-v1");
                const failed = [];

                await Promise.allSettled(
                    urlsToCache.map(async (url) => {
                        try {
                            const response = await fetch(url, { cache: "no-cache" }); // force re-download if changed
                            if (response.ok) {
                                await cache.put(url, response.clone());
                            } else {
                                failed.push(url);
                            }
                        } catch (err) {
                            failed.push(url);
                        }
                    }),
                );

                // notify client(s)
                const clients = await self.clients.matchAll();
                clients.forEach((client) => {
                    if (failed.length > 0) {
                        client.postMessage({ type: "CACHE_ERROR", failedUrls: failed });
                    } else {
                        client.postMessage({ type: "CACHE_COMPLETE" });
                    }
                });
            })(),
        );
    }
});

self.addEventListener("fetch", (event) => {
    const requestUrl = new URL(event.request.url);
    if (requestUrl.hostname === "firebasestorage.googleapis.com") {
        event.respondWith(
            caches.open(IMAGE_CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(event.request).then((networkResponse) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            }),
        );
    }
});