/* The collaboration mark field, loaded only when navigation is opened. */
(() => {
  const menu = document.querySelector("#menu");
  if (!menu) return;
  const stage = document.createElement("div");
  stage.className = "menu-world";
  stage.setAttribute("aria-hidden", "true");
  menu.prepend(stage);
  let background,
    loading = false;
  const isOpen = () =>
    document.body.classList.contains("menu-open") && !document.hidden;
  async function sync() {
    if (!isOpen()) {
      background?.setActive(false);
      return;
    }
    if (!background && !loading) {
      loading = true;
      try {
        if (!window.THREE && !window.KazeyamiLightBackground?.())
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "assets/three.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.append(script);
          });
        background = window.KazeyamiLogoBackground?.(stage);
      } catch {
        // Navigation remains available if WebGL cannot start.
      } finally {
        loading = false;
      }
    }
    background?.setActive(isOpen());
  }
  new MutationObserver(sync).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  document.addEventListener("visibilitychange", sync);
  sync();
})();
