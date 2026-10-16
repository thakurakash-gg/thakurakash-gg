/* Preload the complete scene, then execute the authored modules in their declared order. */
(async () => {
  "use strict";
  const loading = document.getElementById("load-state");
  const scene = document.getElementById("scene");
  const experience = document.getElementById("experience");
  let progress = 0;
  experience.dataset.loading = "true";
  function update(percent, label) {
    progress = Math.max(progress, Math.min(100, percent));
    document.getElementById("load-progress").value = progress;
    document.getElementById("load-percent").textContent = `${Math.round(progress)}%`;
    document.getElementById("load-label").textContent = label;
    loading.setAttribute("aria-valuenow", String(Math.round(progress)));
  }
  window.RayLoad = {
    update,
    complete() {
      update(100, "Ready to explore");
      scene.dataset.loadStage = "ready";
      scene.classList.add("ready");
      delete experience.dataset.loading;
      loading.hidden = true;
    },
  };
  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event.data?.type === "RAY_CACHE_HIT")
      scene.dataset.cacheHits = String(Number(scene.dataset.cacheHits || 0) + 1);
  });
  try {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("./ray-sw.js", {
          scope: "./",
          updateViaCache: "none",
        });
        const pending = registration.installing || registration.waiting;
        if (pending && pending.state !== "activated")
          await new Promise((resolve) => {
            pending.addEventListener("statechange", () => {
              if (pending.state === "activated" || pending.state === "redundant") resolve();
            });
            setTimeout(resolve, 2500);
          });
        await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ]);
        if (!navigator.serviceWorker.controller)
          await new Promise((resolve) => {
            navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
            setTimeout(resolve, 1200);
          });
        scene.dataset.cache = navigator.serviceWorker.controller ? "persistent" : "http";
      } catch {
        scene.dataset.cache = "http";
      }
    }
    update(2, "Preparing your waterfront");
    const manifestResponse = await fetch("assets/ray/scene-manifest.json?v=render-25");
    if (!manifestResponse.ok) throw Error("Scene manifest unavailable");
    const manifest = await manifestResponse.json();
    const loaded = new Map();
    const total = manifest.assets.reduce((sum, asset) => sum + asset.bytes, 0);
    const queue = [...manifest.assets];
    async function preload() {
      while (queue.length) {
        const asset = queue.shift();
        const response = await fetch(asset.url);
        if (!response.ok) throw Error(`Could not load ${asset.url}`);
        if (response.body?.getReader) {
          const reader = response.body.getReader();
          let bytes = 0;
          while (true) {
            const next = await reader.read();
            if (next.done) break;
            bytes += next.value.byteLength;
            loaded.set(asset.url, Math.min(asset.bytes, bytes));
            update(
              2 + (75 * [...loaded.values()].reduce((a, b) => a + b, 0)) / total,
              "Loading the waterfront",
            );
          }
        } else await response.arrayBuffer();
        loaded.set(asset.url, asset.bytes);
      }
    }
    await Promise.all(Array.from({ length: 4 }, preload));
    update(78, "Preparing the neighborhood");
    for (const url of manifest.scripts)
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = resolve;
        script.onerror = () => reject(Error(`Could not start ${url}`));
        document.body.appendChild(script);
      });
  } catch (error) {
    console.error("RAY preload failed", error);
    document.getElementById("load-label").textContent =
      "The scene could not load. Please refresh to try again.";
    loading.dataset.failed = "true";
  }
})();
