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
  // Auth/OAuth traffic must always hit the network — Android opens the Claude
  // connector's sign-in in a Chrome tab that shares this worker, and a cached
  // or mishandled redirect there breaks the handoff back to Claude.
  if (/^\/(api|oauth|auth|login|signup|\.well-known)(\/|$)/.test(url.pathname)) return;

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

  // Everything else (HTML shell, manifest): stale-while-revalidate. Render
  // instantly from cache — this is what makes reopening the PWA feel
  // instant instead of waiting on a network round-trip every time — then
  // refresh the cache in the background for next time. This used to go
  // stale indefinitely because the background refresh was only registered
  // with waitUntil() *after* the network fetch had already resolved, by
  // which point the browser may have already torn the worker down since
  // respondWith() had long since settled from cache. Kicking the fetch off
  // and registering it with waitUntil() in the same tick (before anything
  // is awaited) means the extend-lifetime promise is in place from the
  // start, so the browser can't tear the worker down before the write
  // completes. That, plus sw.js itself now being served with
  // Cache-Control: no-cache (see netlify.toml), means the cache reliably
  // catches up within a visit or two of any new deploy — no need to give
  // up the instant-paint speed to stay correct.
  const networkUpdate = fetch(event.request).then((response) => {
    const copy = response.clone();
    return caches
      .open(CACHE)
      .then((cache) => cache.put(event.request, copy))
      .then(() => response);
  });
  event.waitUntil(networkUpdate.catch(() => {}));
  event.respondWith(
    caches.match(event.request).then((cached) => cached || networkUpdate.catch(() => cached)),
  );
});
