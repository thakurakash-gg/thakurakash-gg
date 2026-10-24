/* Original header mark reveal. SVG only: no WebGL or animation render loop. */
(() => {
  const logo = document.querySelector(".wordmark");
  const base = logo?.querySelector("img");
  if (!base || logo.querySelector(".animated-brand")) return;

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 2048 584");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.classList.add("animated-brand");
  svg.innerHTML = `
    <defs>
      <filter id="brand-pink" color-interpolation-filters="sRGB">
        <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1 -1.1 0 0 0"/>
        <feComposite in2="SourceGraphic" operator="in"/>
      </filter>
      <filter id="brand-white" color-interpolation-filters="sRGB">
        <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 2 0 0 -1"/>
        <feComposite in2="SourceGraphic" operator="in"/>
      </filter>
      <mask id="brand-draw-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="520" height="584">
        <path class="brand-draw-path" d="M390 465 L441 519 Q472 571 421 571 L307 571 Q248 571 265 515 L466 311 Q475 303 475 282 L475 206 Q475 157 438 159 L144 471 Q108 508 143 542 Q165 572 120 572 L44 572 Q12 572 12 540 L12 482 Q12 458 30 441 L397 64 Q424 39 393 14 L184 14 Q173 14 159 27 L21 174 Q12 183 12 200 L12 262 Q12 307 48 276 L215 130" fill="none" stroke="white" stroke-width="88" stroke-linecap="round" stroke-linejoin="round"/>
      </mask>
      <clipPath id="brand-name-clip"><rect x="296" y="206" width="1570" height="206"/></clipPath>
      <clipPath id="brand-subtitle-clip"><rect x="1130" y="423" width="735" height="104"/></clipPath>
      <mask id="brand-name-mask"><rect class="brand-name-reveal" x="296" y="206" width="1570" height="206" fill="white"/></mask>
    </defs>
    <image class="brand-symbol" href="assets/kazeyami-logo-white.png" width="2048" height="584" filter="url(#brand-pink)" mask="url(#brand-draw-mask)"/>
    <g class="brand-name" clip-path="url(#brand-name-clip)" mask="url(#brand-name-mask)">
      <image href="assets/kazeyami-logo-white.png" width="2048" height="584" filter="url(#brand-white)"/>
    </g>
    <g class="brand-subtitle" clip-path="url(#brand-subtitle-clip)">
      <image href="assets/kazeyami-logo-white.png" width="2048" height="584" filter="url(#brand-white)"/>
    </g>`;

  const path = svg.querySelector(".brand-draw-path");
  const name = svg.querySelector(".brand-name-reveal");
  const subtitle = svg.querySelector(".brand-subtitle");
  const animations = new Set();
  let timer, length, ready = false, visible = true;

  // Follow the same surface-aware colour as the static fallback image.
  function syncTone() {
    const ink = base.getAttribute("src")?.includes("logo-light.svg");
    for (const part of svg.querySelectorAll(".brand-name, .brand-subtitle")) {
      part.style.filter = ink ? "brightness(0)" : "none";
    }
  }
  function animate(element, frames, options) {
    const animation = element.animate(frames, options);
    animations.add(animation);
    animation.finished.then(() => {
      animations.delete(animation);
      animation.cancel();
    }, () => animations.delete(animation));
  }
  function draw() {
    animate(path, [{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
      duration: 1450, easing: "cubic-bezier(.45,0,.2,1)",
    });
  }
  function schedule() {
    clearTimeout(timer);
    if (!ready || !visible || document.hidden || motion.matches) return;
    timer = setTimeout(() => {
      draw();
      schedule();
    }, 10000 + Math.random() * 5000);
  }
  function syncActivity() {
    clearTimeout(timer);
    if (document.hidden || !visible || motion.matches) {
      for (const animation of animations) animation.cancel();
      animations.clear();
    }
    schedule();
  }
  function start() {
    if (ready) return;
    syncTone();
    logo.append(svg);
    length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = "0";
    ready = true;
    logo.classList.add("brand-ready");
    if (!motion.matches && !document.hidden && visible) {
      draw();
      animate(name, [{ width: "0px", opacity: 0 }, { width: "1570px", opacity: 1 }], {
        duration: 850, delay: 1250, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards",
      });
      animate(subtitle, [{ opacity: 0, transform: "translateY(-70px)" }, { opacity: 1, transform: "translateY(0)" }], {
        duration: 700, delay: 1950, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards",
      });
    }
    schedule();
  }

  new MutationObserver(syncTone).observe(base, { attributes: true, attributeFilter: ["src"] });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncActivity();
  }).observe(logo);
  motion.addEventListener("change", syncActivity);
  document.addEventListener("visibilitychange", syncActivity);

  // Keep the original <img> visible if the animation asset cannot load.
  const image = new Image();
  image.onload = start;
  image.src = "assets/kazeyami-logo-white.png";
  if (image.complete && image.naturalWidth) start();
})();
