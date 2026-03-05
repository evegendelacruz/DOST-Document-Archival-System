// DOST DAS Service Worker — cache-first for static assets, network-only for API
const STATIC_CACHE = "dost-das-static-v3";
const PAGE_CACHE = "dost-das-pages-v3";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache API routes — always fresh from DB
  if (url.pathname.startsWith("/api/")) return;

  // Skip HMR and webpack dev websocket
  if (
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.includes("__nextjs")
  ) return;

  // ── Static assets: JS/CSS/fonts/images with content hashes ──
  // These are safe to cache forever (filenames change when content changes)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf)$/)
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((res) => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // ── Page navigations: stale-while-revalidate ──
  // Serve from cache immediately, then update in background
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.open(PAGE_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          const networkFetch = fetch(event.request).then((res) => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          }).catch(() => cached || caches.match("/"));

          return cached || networkFetch;
        })
      )
    );
    return;
  }
});
