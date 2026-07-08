const CACHE = "liftcipher-v2";

// Hashed build output (filename changes on every deploy) — safe to serve
// straight from cache forever, no network round-trip needed even on the
// very first paint after a cold open.
const IMMUTABLE = /\/_next\/static\/|\/icons\/|\.(?:woff2?|png|jpg|jpeg|svg|ico)$/;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (IMMUTABLE.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  // Everything else (HTML shell, manifest): stale-while-revalidate. Render
  // instantly from cache on reopen instead of blocking on the network, then
  // quietly refresh the cache in the background for next time.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
