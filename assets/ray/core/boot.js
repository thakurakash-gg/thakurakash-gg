/* Discover a release, verify all of its bytes, then reveal one consistent scene. */
(async () => {
  "use strict";
  const loading = document.getElementById("load-state");
  const scene = document.getElementById("scene");
  const experience = document.getElementById("experience");
  const staged = new Map();
  let progress = 0;
  let manifest;
  let persistent = false;
  experience.dataset.loading = "true";
  function update(percent, label) {
    progress = Math.max(progress, Math.min(100, percent));
    document.getElementById("load-progress").value = progress;
    document.getElementById("load-percent").textContent =
      `${Math.round(progress)}%`;
    document.getElementById("load-label").textContent = label;
    loading.setAttribute("aria-valuenow", String(Math.round(progress)));
  }
  function workerRequest(type, data = {}) {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker?.controller) return resolve(null);
      const channel = new MessageChannel();
      const finish = (value) => {
        clearTimeout(timeout);
        channel.port1.close();
        resolve(value);
      };
      const timeout = setTimeout(() => finish(null), 5000);
      channel.port1.onmessage = (event) => finish(event.data);
      navigator.serviceWorker.controller.postMessage({ type, ...data }, [
        channel.port2,
      ]);
    });
  }
  function validManifest(value) {
    return (
      value?.schema === 2 &&
      /^scene-[a-f0-9]{16}$/.test(value.version) &&
      Array.isArray(value.assets) &&
      value.assets.length > 0 &&
      Array.isArray(value.scripts) &&
      value.assets.every(
        (asset) =>
          /^[a-f0-9]{64}$/.test(asset.sha256) &&
          asset.bytes > 0 &&
          new URL(asset.url, location.href).origin === location.origin &&
          new URL(asset.url, location.href).searchParams.get("v") ===
            asset.sha256,
      ) &&
      value.scripts.every((url) =>
        value.assets.some((asset) => asset.url === url),
      )
    );
  }
  window.RayLoad = {
    update,
    async complete() {
      if (persistent) {
        const saved = await workerRequest("RAY_COMMIT_RELEASE", { manifest });
        if (saved?.version) scene.dataset.cachedVersion = saved.version;
      }
      for (const asset of staged.values()) URL.revokeObjectURL(asset.blobURL);
      staged.clear();
      update(100, "Ready to explore");
      scene.dataset.loadStage = "ready";
      scene.classList.add("ready");
      delete experience.dataset.loading;
      loading.hidden = true;
    },
  };
  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event.data?.type === "RAY_CACHE_HIT")
      scene.dataset.cacheHits = String(
        Number(scene.dataset.cacheHits || 0) + 1,
      );
  });
  try {
    update(1, "Checking for updates");
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(
          "./ray-sw.js",
          { scope: "./", updateViaCache: "none" },
        );
        await registration.update().catch(() => {});
        const pending = registration.installing || registration.waiting;
        if (pending && pending.state !== "activated")
          await new Promise((resolve) => {
            pending.addEventListener("statechange", () => {
              if (
                pending.state === "activated" ||
                pending.state === "redundant"
              )
                resolve();
            });
            setTimeout(resolve, 5000);
          });
        if (!navigator.serviceWorker.controller)
          await new Promise((resolve) => {
            navigator.serviceWorker.addEventListener(
              "controllerchange",
              resolve,
              { once: true },
            );
            setTimeout(resolve, 1500);
          });
        persistent =
          (await workerRequest("RAY_CACHE_PROTOCOL"))?.protocol === 2;
      } catch {
        /* Verified downloads also work without persistent storage. */
      }
    }
    scene.dataset.cache = persistent ? "persistent" : "http";
    let response;
    try {
      // The nonce also bypasses a cache-first worker left over from an older release.
      response = await fetch(
        `assets/ray/scene-manifest.json?check=${Date.now()}`,
        { cache: "no-store", signal: AbortSignal.timeout(15000) },
      );
    } catch (error) {
      const saved = persistent
        ? await workerRequest("RAY_SAVED_RELEASE")
        : null;
      if (!validManifest(saved?.manifest)) throw error;
      manifest = saved.manifest;
      scene.dataset.releaseSource = "offline";
    }
    if (response) {
      if (!response.ok) throw Error("Scene update unavailable");
      manifest = await response.json();
      scene.dataset.releaseSource = "network";
    }
    if (!validManifest(manifest)) throw Error("Invalid scene release");
    scene.dataset.version = manifest.version;
    const byPath = new Map(
      manifest.assets.map((asset) => [asset.url.split("?")[0], asset]),
    );
    // Model, texture and script consumers receive exactly the verified preload bytes.
    window.RayAssets = {
      get(name) {
        const asset = byPath.get(name.split("?")[0]);
        if (!asset) throw Error(`Undeclared scene asset: ${name}`);
        return staged.get(asset.url)?.blobURL || asset.url;
      },
    };
    const loaded = new Map();
    const total = manifest.assets.reduce((sum, asset) => sum + asset.bytes, 0);
    const queue = [...manifest.assets];
    async function preload() {
      while (queue.length) {
        const asset = queue.shift();
        const response = await fetch(asset.url, { cache: "no-store" });
        if (!response.ok) throw Error(`Could not load ${asset.url}`);
        let bytes;
        if (response.body?.getReader) {
          const reader = response.body.getReader();
          const chunks = [];
          let count = 0;
          while (true) {
            const next = await reader.read();
            if (next.done) break;
            chunks.push(next.value);
            count += next.value.byteLength;
            loaded.set(asset.url, Math.min(asset.bytes, count));
            update(
              2 +
                (75 * [...loaded.values()].reduce((a, b) => a + b, 0)) / total,
              scene.dataset.releaseSource === "offline"
                ? "Opening the saved waterfront"
                : "Loading the latest waterfront",
            );
          }
          bytes = new Uint8Array(count);
          let offset = 0;
          for (const chunk of chunks) {
            bytes.set(chunk, offset);
            offset += chunk.byteLength;
          }
        } else bytes = new Uint8Array(await response.arrayBuffer());
        const digest = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
          (byte) => byte.toString(16).padStart(2, "0"),
        ).join("");
        if (digest !== asset.sha256 || bytes.byteLength !== asset.bytes)
          throw Error("The release is still updating. Please retry.");
        const name = asset.url.split("?")[0];
        const type = name.endsWith(".js")
          ? "text/javascript"
          : name.endsWith(".css")
            ? "text/css"
            : name.endsWith(".png")
              ? "image/png"
              : "model/gltf-binary";
        staged.set(asset.url, {
          blobURL: URL.createObjectURL(new Blob([bytes], { type })),
        });
        loaded.set(asset.url, asset.bytes);
      }
    }
    await Promise.all(Array.from({ length: 4 }, preload));
    for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
      const path = new URL(link.href).pathname;
      const asset = manifest.assets.find(
        (asset) => new URL(asset.url, location.href).pathname === path,
      );
      if (asset) link.href = window.RayAssets.get(asset.url);
    }
    update(78, "Preparing the neighborhood");
    for (const url of manifest.scripts)
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = window.RayAssets.get(url);
        script.onload = resolve;
        script.onerror = () => reject(Error(`Could not start ${url}`));
        document.body.appendChild(script);
      });
  } catch (error) {
    console.error("RAY preload failed", error);
    document.getElementById("load-label").textContent =
      "The scene update could not finish. Please refresh to retry.";
    loading.dataset.failed = "true";
    for (const asset of staged.values()) URL.revokeObjectURL(asset.blobURL);
    staged.clear();
  }
})();
