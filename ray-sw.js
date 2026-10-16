/* Content-addressed scene assets. A new model never reuses an old model's cache key. */
const CONTENT_CACHE = "ray-scene-content-v2";
const RELEASE_CACHE = "ray-scene-releases-v2";
const releaseURL = (name) =>
  new URL(`./ray-release/${name}`, self.registration.scope).href;
const hex = (bytes) =>
  Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("message", (event) => {
  const reply = (data) => event.ports[0]?.postMessage(data);
  event.waitUntil(
    (async () => {
      try {
        if (event.data?.type === "RAY_CACHE_PROTOCOL")
          return reply({ protocol: 2 });
        const releases = await caches.open(RELEASE_CACHE);
        if (event.data?.type === "RAY_SAVED_RELEASE") {
          const saved = await releases.match(releaseURL("latest"));
          return reply({ manifest: saved ? await saved.json() : null });
        }
        if (event.data?.type !== "RAY_COMMIT_RELEASE") return;
        const manifest = event.data.manifest;
        if (
          manifest?.schema !== 2 ||
          !/^scene-[a-f0-9]{16}$/.test(manifest.version)
        )
          throw Error("Invalid release");
        const latest = await releases.match(releaseURL("latest"));
        const previous = latest ? await latest.json() : null;
        if (previous && previous.version !== manifest.version)
          await releases.put(
            releaseURL("previous"),
            new Response(JSON.stringify(previous)),
          );
        await releases.put(
          releaseURL("latest"),
          new Response(JSON.stringify(manifest)),
        );
        // Keep two completed releases; never discard the working cache during an update.
        const older = await releases.match(releaseURL("previous"));
        const keep = [manifest, older ? await older.json() : null].filter(
          Boolean,
        );
        const retained = new Set(
          keep.flatMap((release) =>
            release.assets.map(
              (asset) => new URL(asset.url, self.registration.scope).href,
            ),
          ),
        );
        const content = await caches.open(CONTENT_CACHE);
        for (const request of await content.keys())
          if (!retained.has(request.url)) await content.delete(request);
        for (const name of await caches.keys())
          if (
            name.startsWith("ray-scene-") &&
            name !== CONTENT_CACHE &&
            name !== RELEASE_CACHE
          )
            await caches.delete(name);
        reply({ version: manifest.version });
      } catch (error) {
        reply({ error: error.message });
      }
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const sceneAsset =
    url.pathname.includes("/assets/ray/") ||
    url.pathname.endsWith("/assets/three.min.js") ||
    /\/assets\/vendor\/ray-/.test(url.pathname);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !sceneAsset
  )
    return;
  // Every launch must discover the current release.
  if (
    url.pathname.endsWith("/scene-manifest.json") ||
    url.pathname.endsWith("/core/boot.js")
  ) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }
  const digest = url.searchParams.get("v");
  if (!/^[a-f0-9]{64}$/.test(digest || "")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }
  event.respondWith(
    (async () => {
      const cache = await caches.open(CONTENT_CACHE);
      const saved = await cache.match(event.request);
      if (saved) {
        const client = await self.clients.get(event.clientId);
        client?.postMessage({ type: "RAY_CACHE_HIT" });
        return saved;
      }
      const response = await fetch(event.request, { cache: "no-store" });
      if (!response.ok) return response;
      const bytes = await response.clone().arrayBuffer();
      if (hex(await crypto.subtle.digest("SHA-256", bytes)) !== digest)
        return new Response("Scene asset is still updating. Please retry.", {
          status: 503,
        });
      await cache.put(event.request, response.clone()).catch(() => {});
      return response;
    })(),
  );
});
