// Hand-written service worker (no Workbox/next-pwa — Next.js 16 defaults to
// Turbopack, which doesn't run the webpack plugins those tools rely on).
// Caching for installability/offline only — no push notifications.

const CACHE_VERSION = "pyatyi-vkus-v2";
const APP_SHELL = ["/", "/menu", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API calls, checkout, or admin requests.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/checkout") ||
    url.pathname.startsWith("/admin")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline").then((res) => res || Response.error())),
    );
    return;
  }

  if (request.destination === "image") {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
  }
});
