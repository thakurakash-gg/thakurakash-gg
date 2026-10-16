/* Versioned, same-origin scene cache. Other pages and third-party requests are untouched. */
const CACHE_NAME = "ray-scene-render-25-final";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("ray-scene-") && name !== CACHE_NAME) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const sceneAsset =
    url.pathname.includes("/assets/ray/") ||
    url.pathname.endsWith("/assets/three.min.js") ||
    /\/assets\/vendor\/ray-/.test(url.pathname);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !sceneAsset) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      if (cached) {
        const client = await self.clients.get(event.clientId);
        client?.postMessage({ type: "RAY_CACHE_HIT" });
        return cached;
      }
      const response = await fetch(event.request);
      if (response.ok) event.waitUntil(cache.put(event.request, response.clone()).catch(() => {}));
      return response;
    })(),
  );
});
