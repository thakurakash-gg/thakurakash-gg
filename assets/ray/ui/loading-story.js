/* A two-image loading backdrop. Never gates the scene's readiness. */
(() => {
  "use strict";
  const loading = document.getElementById("load-state");
  const story = document.getElementById("load-story");
  if (!loading || !story || loading.hidden) return;
  const frames = [...story.querySelectorAll("img")];
  const shots = [...story.querySelectorAll("[data-story-src]")].map((item) => ({
    src: item.dataset.storySrc,
    caption: item.dataset.caption,
  }));
  if (frames.length !== 2 || shots.length < 2) return;
  const caption = document.getElementById("load-scene-caption");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let front = frames[0],
    queue = [],
    last = 0,
    timer,
    stopped = false,
    busy = false;
  const active = () => !stopped && !loading.hidden && !loading.dataset.failed;
  function shuffle() {
    queue = shots.map((_, index) => index).filter((index) => index !== last);
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
  }
  function schedule() {
    clearTimeout(timer);
    if (
      active() &&
      !document.hidden &&
      !reduced.matches &&
      !navigator.connection?.saveData
    )
      timer = setTimeout(next, 4600);
  }
  async function next() {
    if (!active() || document.hidden || busy) return;
    if (!queue.length) shuffle();
    const index = queue.shift(),
      shot = shots[index];
    const back = frames.find((frame) => frame !== front);
    busy = true;
    back.classList.remove("is-leaving");
    const loaded = await new Promise((resolve) => {
      back.onload = () => resolve(true);
      back.onerror = () => resolve(false);
      back.src = shot.src;
    });
    if (loaded && active() && !document.hidden) {
      try {
        await back.decode();
      } catch {
        /* Image decoding must not affect startup. */
      }
      if (active() && !document.hidden) {
        front.classList.add("is-leaving");
        front.classList.remove("is-active");
        back.classList.add("is-active");
        front = back;
        last = index;
        if (caption) caption.textContent = shot.caption;
      }
    }
    busy = false;
    schedule();
  }
  function stop() {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    observer.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    reduced.removeEventListener("change", motion);
    for (const frame of frames) {
      frame.onload = frame.onerror = null;
      frame.classList.remove("is-active", "is-leaving");
    }
  }
  function visibility() {
    story.classList.toggle("is-suspended", document.hidden);
    document.hidden ? clearTimeout(timer) : schedule();
  }
  function motion() {
    story.classList.toggle(
      "is-still",
      reduced.matches || !!navigator.connection?.saveData,
    );
    reduced.matches ? clearTimeout(timer) : schedule();
  }
  const observer = new MutationObserver(() => {
    if (!active() || !loading.contains(story)) stop();
  });
  observer.observe(loading, {
    attributes: true,
    attributeFilter: ["hidden", "data-failed"],
    childList: true,
  });
  document.addEventListener("visibilitychange", visibility);
  reduced.addEventListener("change", motion);
  story.addEventListener("transitionend", (event) => {
    if (event.propertyName === "opacity" && event.target !== front)
      event.target.classList.remove("is-leaving");
  });
  motion();
  visibility();
})();
