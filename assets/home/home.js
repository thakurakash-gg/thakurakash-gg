/* Page chrome uses native scrolling. Existing project forms and direction videos
   continue to be owned by site.js. */
(() => {
  if (location.hash === "#team") { location.replace("team.html"); return; }
  const percent = document.querySelector("#read-percent");
  let queued = false;
  function update() {
    queued = false;
    const range = document.documentElement.scrollHeight - innerHeight;
    const overDark = ["opening", "contact"].some((id) => {
      const bounds = document.getElementById(id).getBoundingClientRect();
      return bounds.top <= 48 && bounds.bottom > 48;
    });
    document.body.classList.toggle("over-dark-section", overDark);
    document.body.classList.toggle("header-scrolled", scrollY > innerHeight);
    percent.textContent =
      Math.round(range > 0 ? (scrollY / range) * 100 : 0) + "%";
  }
  addEventListener(
    "scroll",
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  new ResizeObserver(update).observe(document.body);
  update();
  const openingVideo = document.querySelector("#opening-work-video");
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  let openingVisible = false;
  function syncOpeningVideo() {
    if (
      openingVisible &&
      !document.hidden &&
      !document.body.classList.contains("menu-open") &&
      !preference.matches &&
      !navigator.connection?.saveData
    ) {
      openingVideo.muted = true;
      openingVideo.play().catch(() => {});
    } else openingVideo.pause();
  }
  new IntersectionObserver(
    (entries) => {
      openingVisible = entries[0].isIntersecting;
      syncOpeningVideo();
    },
    { threshold: 0.05 },
  ).observe(openingVideo);
  document.addEventListener("visibilitychange", syncOpeningVideo);
  preference.addEventListener("change", syncOpeningVideo);
  new MutationObserver(syncOpeningVideo).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  const video = document.querySelector("#hero-video");
  if (!video) return;
  let filmVisible = false;
  function syncFilm() {
    const active = filmVisible && !document.hidden && !document.body.classList.contains("menu-open") && !preference.matches;
    if (!active) { video.pause(); return; }
    if (!video.getAttribute("src")) {
      video.src = video.dataset.src;
      video.load();
    }
    video.muted = true;
    video.play().catch(() => {});
  }
  new IntersectionObserver(entries => {
    filmVisible = entries[0].isIntersecting;
    syncFilm();
  }, { threshold: 0.08 }).observe(video);
  document.addEventListener("visibilitychange", syncFilm);
  preference.addEventListener("change", syncFilm);
  new MutationObserver(syncFilm).observe(document.body, { attributes: true, attributeFilter: ["class"] });
})();
