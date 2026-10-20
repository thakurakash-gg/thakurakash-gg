/* The collaboration section uses the same mark field as the menu. */
(() => {
  const section = document.querySelector(".contact-section");
  if (!section) return;
  let stage = section.querySelector(".contact-logo-background");
  if (!stage) {
    stage = document.createElement("div");
    stage.id = "contact-logo-background";
    stage.className = "contact-logo-background";
    stage.setAttribute("aria-hidden", "true");
    section.prepend(stage);
  }
  let visible = false,
    background,
    loading = false;
  const isActive = () =>
    visible && !document.body.classList.contains("menu-open");
  async function sync() {
    if (!isActive()) {
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
        // The readable contact surface remains available without WebGL.
      } finally {
        loading = false;
      }
    }
    background?.setActive(isActive());
  }
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      sync();
    },
    { threshold: 0.01 },
  ).observe(stage);
  new MutationObserver(sync).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
})();
