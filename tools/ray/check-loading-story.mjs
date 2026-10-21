import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const source = fs.readFileSync(
  new URL("../../assets/ray/ui/loading-story.js", import.meta.url),
  "utf8",
);
function mount({ reduced = false, saveData = false } = {}) {
  const classes = (initial = []) => {
    const s = new Set(initial);
    return {
      add(...v) {
        v.forEach((x) => s.add(x));
      },
      remove(...v) {
        v.forEach((x) => s.delete(x));
      },
      toggle(v, on) {
        on ? s.add(v) : s.delete(v);
      },
      has: (v) => s.has(v),
    };
  };
  const frames = [
    { classList: classes(["is-active"]), decode: async () => {} },
    { classList: classes(), decode: async () => {} },
  ];
  const timers = new Map(),
    events = new Map(),
    caption = { textContent: "first" };
  let id = 0,
    observer;
  const loading = { hidden: false, dataset: {}, contains: () => true };
  const story = {
    classList: classes(),
    addEventListener() {},
    querySelectorAll: (s) =>
      s === "img"
        ? frames
        : [0, 1, 2, 3].map((i) => ({ dataset: { storySrc: "shot" + i, caption: "caption" + i } })),
  };
  const motion = {
    matches: reduced,
    addEventListener(_, fn) {
      this.change = fn;
    },
    removeEventListener() {
      this.change = null;
    },
  };
  const document = {
    hidden: false,
    getElementById: (id) =>
      ({ "load-state": loading, "load-story": story, "load-scene-caption": caption })[id],
    addEventListener: (n, f) => events.set(n, f),
    removeEventListener: (n) => events.delete(n),
  };
  vm.runInNewContext(source, {
    document,
    navigator: { connection: { saveData } },
    matchMedia: () => motion,
    setTimeout: (fn) => {
      timers.set(++id, fn);
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    MutationObserver: class {
      constructor(fn) {
        this.fn = fn;
        observer = this;
      }
      observe() {}
      disconnect() {
        this.disconnected = true;
      }
    },
  });
  const begin = () => {
    const [id, fn] = timers.entries().next().value;
    timers.delete(id);
    return fn();
  };
  return { frames, timers, loading, caption, document, events, motion, observer, begin };
}
const normal = mount();
assert.equal(normal.timers.size, 1, "Only one transition timer should run");
assert(!normal.frames[1].src, "A later image must not compete with the first load");
const pending = normal.begin();
assert(normal.frames[1].src && normal.frames[0].classList.has("is-active"));
normal.frames[1].onload();
await pending;
assert(normal.frames[1].classList.has("is-active"), "Show the next shot only once ready");
assert(!normal.frames[0].classList.has("is-active"));
assert.match(normal.caption.textContent, /caption[123]/);
normal.document.hidden = true;
normal.events.get("visibilitychange")();
assert.equal(normal.timers.size, 0, "Hidden tabs must stop the slideshow timer");
normal.document.hidden = false;
normal.events.get("visibilitychange")();
assert.equal(normal.timers.size, 1);
normal.loading.hidden = true;
normal.observer.fn();
assert.equal(normal.timers.size, 0, "Scene readiness must end the slideshow immediately");
assert(normal.observer.disconnected);
assert(!normal.events.has("visibilitychange"));
for (const options of [{ reduced: true }, { saveData: true }])
  assert.equal(mount(options).timers.size, 0, "Reduced motion or data saving keeps a single still");
const failed = mount(),
  failure = failed.begin();
failed.frames[1].onerror();
await failure;
assert(failed.frames[0].classList.has("is-active"), "An image failure must keep the current shot");
failed.loading.dataset.failed = "true";
failed.observer.fn();
assert.equal(failed.timers.size, 0);
const race = mount(),
  inFlight = race.begin();
const finish = race.frames[1].onload;
race.loading.hidden = true;
race.observer.fn();
finish();
await inFlight;
assert(
  !race.frames.some((f) => f.classList.has("is-active")),
  "A late image must not restart a completed loader",
);
assert.equal(race.timers.size, 0);
console.log(
  "Pass: loading shots advance after image readiness, pause in hidden tabs, respect motion/data settings, survive image errors and stop on scene readiness.",
);
