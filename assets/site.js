const themeSwitch = document.querySelector(".theme-switch"),
  headerLogo = document.querySelector(".wordmark img");
function syncTheme() {
  const dark = document.documentElement.dataset.theme === "dark";
  themeSwitch.setAttribute("aria-checked", String(dark));
  document.querySelector(".theme-label").textContent = dark ? "DARK" : "LIGHT";
  document.querySelector(".theme-kanji").textContent = dark ? "夜" : "昼";
  headerLogo.src =
    document.documentElement.dataset.theme === "dark" ||
    document.body.classList.contains("over-dark-section")
      ? "assets/kazeyami-logo-white.png"
      : "assets/kazeyami-logo-light.svg";
}
themeSwitch.addEventListener("click", () => {
  document.documentElement.dataset.theme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(
      "kazeyami-theme",
      document.documentElement.dataset.theme,
    );
  } catch {}
  syncTheme();
});
syncTheme();
if (document.querySelector(".hero")) {
  const hero = document.querySelector(".hero"),
    trail = document.querySelector(".trail-layer"),
    trailPreference = matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
  let lastPoint = null,
    distance = 0,
    index = 0;
  const kanji = ["風", "光", "空", "夢", "創", "美"];
  const icons = Array.from({ length: 6 }, () => {
    const el = document.createElement("div");
    el.className = "trail-icon kanji-trail";
    trail.append(el);
    return { el, animation: null };
  });
  function stamp(x, y) {
    const sequence = index++;
    const item = icons[sequence % icons.length];
    item.el.textContent = kanji[sequence % kanji.length];
    item.animation?.cancel();
    item.el.style.left = x + 10 + "px";
    item.el.style.top = y - 30 + "px";
    item.animation = item.el.animate(
      [
        { opacity: 0, transform: "scale(.85)", offset: 0 },
        { opacity: 1, transform: "scale(1)", offset: 240 / 840 },
        { opacity: 1, transform: "scale(1)", offset: 600 / 840 },
        { opacity: 0, transform: "scale(.97)", offset: 1 },
      ],
      { duration: 840, fill: "both" },
    );
  }
  hero.addEventListener(
    "pointermove",
    (e) => {
      if (
        !trailPreference.matches ||
        e.pointerType !== "mouse" ||
        document.body.classList.contains("menu-open") ||
        e.target.closest("a,button")
      )
        return;
      const box = hero.getBoundingClientRect(),
        point = { x: e.clientX - box.left, y: e.clientY - box.top };
      if (!lastPoint) {
        stamp(point.x, point.y);
        distance = 0;
      } else {
        distance += Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
        if (distance >= 90) {
          stamp(point.x, point.y);
          distance = 0;
        }
      }
      lastPoint = point;
    },
    { passive: true },
  );
  hero.addEventListener("pointerleave", () => {
    lastPoint = null;
    distance = 0;
  });
  trailPreference.addEventListener("change", () => {
    icons.forEach((i) => i.animation?.cancel());
    lastPoint = null;
  });
}
(() => {
  const form = document.querySelector("#brief-form");
  if (!form) return;
  const status = document.querySelector("#brief-status"),
    copy = document.querySelector("#brief-copy-text");
  const defaults = {
    "nexiv.html": "Architectural visualization",
    "studio.html": "3D assets, characters & animation",
    "products.html": "Full-stack web & mobile development",
    "events.html": "Events & Experiences",
  };
  const service =
    new URLSearchParams(location.search).get("service") ||
    defaults[location.pathname.split("/").pop()] ||
    "Not sure / a combination";
  if (
    service &&
    [...form.elements.service.options].some(
      (option) => option.value === service,
    )
  )
    form.elements.service.value = service;
  function prepare() {
    return window.KazeyamiEnquiry.build(Object.fromEntries(new FormData(form)));
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const draft = prepare();
    copy.value = draft.body;
    copy.hidden = false;
    const link = document.createElement("a");
    link.href = draft.mailto;
    link.click();
    status.textContent =
      "Draft prepared. Review and send it in your email app, or copy the brief below and email sales@kazeyami.com. Nothing has been sent from this form.";
  });
  document.querySelector("#copy-brief").addEventListener("click", async () => {
    const draft = prepare();
    copy.value = draft.body;
    copy.hidden = false;
    try {
      await navigator.clipboard.writeText(draft.body);
      status.textContent =
        "Project brief copied. Paste it into your email to sales@kazeyami.com.";
    } catch {
      copy.focus();
      copy.select();
      status.textContent =
        "Select and copy the prepared brief below, then email sales@kazeyami.com.";
    }
  });
})();
if (
  document.querySelector("#hero-video") &&
  !document.body.classList.contains("katana-site")
) {
  const video = document.querySelector("#hero-video"),
    videoToggle = document.querySelector(".video-toggle"),
    motion = matchMedia("(prefers-reduced-motion: reduce)");
  function updateVideoButton() {
    const label = video.paused ? "Play video" : "Pause video";
    videoToggle.textContent = label;
    videoToggle.setAttribute("aria-label", label);
  }
  video.addEventListener("play", updateVideoButton);
  video.addEventListener("pause", updateVideoButton);
  videoToggle.addEventListener("click", () => {
    if (video.paused) video.play().catch(updateVideoButton);
    else video.pause();
  });
  if (!motion.matches) video.play().catch(updateVideoButton);
  motion.addEventListener("change", (e) => {
    if (e.matches) video.pause();
  });
}
new MutationObserver(syncTheme).observe(document.body, {
  attributes: true,
  attributeFilter: ["class"],
});
const toggle = document.querySelector(".menu-toggle"),
  menu = document.querySelector("#menu"),
  main = document.querySelector("main"),
  footer = document.querySelector("footer");
function setMenu(open) {
  menu.inert = !open;
  menu.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("menu-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  main.inert = open;
  footer.inert = open;
  headerLogo.src =
    document.documentElement.dataset.theme === "dark" ||
    document.body.classList.contains("over-dark-section")
      ? "assets/kazeyami-logo-white.png"
      : "assets/kazeyami-logo-light.svg";
  if (open) menu.querySelector("a").focus();
  else toggle.focus();
}
toggle.addEventListener("click", () =>
  setMenu(!document.body.classList.contains("menu-open")),
);
menu
  .querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => {
  if (!document.body.classList.contains("menu-open")) return;
  if (e.key === "Escape") setMenu(false);
  if (e.key === "Tab") {
    const items = [themeSwitch, toggle, ...menu.querySelectorAll("a")],
      first = items[0],
      last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

(() => {
  const rows = [...document.querySelectorAll(".direction-row")],
    motion = matchMedia("(prefers-reduced-motion: reduce)");
  rows.forEach((row) => {
    const video = row.querySelector("video");
    if (!video) return;
    let wanted = false;
    function start() {
      wanted = true;
      if (motion.matches || navigator.connection?.saveData) return;
      rows.forEach((other) => {
        if (other !== row) other.querySelector("video")?.pause();
      });
      video
        .play()
        .then(() => {
          if (!wanted) video.pause();
        })
        .catch(() => {});
    }
    function stop() {
      wanted = false;
      video.pause();
    }
    row.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") start();
    });
    row.addEventListener("pointerleave", stop);
    row.addEventListener("focus", start);
    row.addEventListener("blur", stop);
    new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) stop();
      },
      { threshold: 0.1 },
    ).observe(row);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
    });
    motion.addEventListener("change", () => {
      if (motion.matches) stop();
    });
  });
})();
