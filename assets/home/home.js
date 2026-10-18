/* Page chrome uses native scrolling. Existing project forms and direction videos
   continue to be owned by site.js. */
(() => {
  const percent = document.querySelector("#read-percent");
  let queued = false;
  function update() {
    queued = false;
    const range = document.documentElement.scrollHeight - innerHeight;
    document.body.classList.toggle('header-scrolled', scrollY > innerHeight);
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
  const video = document.querySelector("#hero-video");
  const videoButton = document.querySelector(".video-toggle");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false,
    userPaused = false;
  function syncVideo() {
    videoButton.textContent = video.paused ? "Play video" : "Pause video";
  }
  video.addEventListener("play", syncVideo);
  video.addEventListener("pause", syncVideo);
  videoButton.addEventListener("click", () => {
    userPaused = !video.paused;
    if (video.paused) video.play().catch(syncVideo);
    else video.pause();
  });
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (
        visible &&
        !userPaused &&
        !motion.matches &&
        !navigator.connection?.saveData
      )
        video.play().catch(() => {});
      else video.pause();
    },
    { threshold: 0.25 },
  ).observe(video);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden || !visible) video.pause();
  });
})();
