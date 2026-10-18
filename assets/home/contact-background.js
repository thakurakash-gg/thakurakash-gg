/* The collaboration section uses the same mark field as the menu. */
(() => {
  const stage = document.querySelector("#contact-logo-background");
  if (!stage) return;
  const background = window.KazeyamiLogoBackground?.(stage);
  if (!background) return;
  let visible = false;
  const sync = () =>
    background.setActive(
      visible && !document.body.classList.contains("menu-open"),
    );
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
