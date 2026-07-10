const CACHE = "liftcipher-v3";

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
            event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)));
            return response;
          }),
      ),
    );
    return;
  }

  // Everything else (HTML shell, manifest): network-first. This app ships
  // fixes frequently, and a previous stale-while-revalidate strategy here
  // meant every visit could show what was cached from the *previous* visit,
  // one deploy behind — worse, the background cache refresh wasn't wrapped
  // in waitUntil(), so mobile browsers could suspend the service worker
  // before that write ever completed, leaving a device stuck on a much
  // older snapshot indefinitely rather than just one visit behind. Always
  // go to the network first when online; only fall back to cache (for
  // offline use) if the network fetch fails.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
