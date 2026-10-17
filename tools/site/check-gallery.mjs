/* Exercise the real gallery setup with Three.js geometry and a minimal host, without a GPU. */
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const THREE = require("../../assets/three.min.js");
const source = fs.readFileSync(
  new URL("../../assets/studio/home-gallery.js", import.meta.url),
  "utf8",
);

function host({ reduced = false, saveData = false, memory = 8 } = {}) {
  const frames = new Map(),
    observers = [],
    renderers = [];
  let frameId = 0;
  class Element {
    constructor() {
      this.events = new Map();
      this.attrs = new Map();
      this.dataset = {};
      this.hidden = false;
      this.textContent = "";
      this.clientWidth = 1200;
      this.clientHeight = 520;
      const names = new Set();
      this.classList = {
        add: (n) => names.add(n),
        remove: (n) => names.delete(n),
        contains: (n) => names.has(n),
      };
    }
    addEventListener(name, callback) {
      const listeners = this.events.get(name) || [];
      listeners.push(callback);
      this.events.set(name, listeners);
    }
    fire(name, event = {}) {
      return Promise.all(
        (this.events.get(name) || []).map((callback) => callback(event)),
      );
    }
    setAttribute(name, value) {
      this.attrs.set(name, value);
    }
    getAttribute(name) {
      return name === "src" ? this.src || null : this.attrs.get(name) || null;
    }
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 1200, height: 520 };
    }
    getContext() {
      return { clearRect() {}, fillText() {} };
    }
    setPointerCapture() {}
  }
  const stage = new Element(),
    canvas = new Element(),
    video = new Element();
  const motion = new Element(),
    view = new Element(),
    hint = new Element(),
    status = new Element();
  stage.querySelector = (selector) => (selector === "canvas" ? canvas : null);
  video.paused = true;
  video.load = () => {};
  video.play = () => {
    video.paused = false;
    video.fire("play");
    return Promise.resolve();
  };
  video.pause = () => {
    video.paused = true;
  };
  const document = new Element();
  document.hidden = false;
  const elements = {
    "#studio-gallery": stage,
    "#gallery-video": video,
    "#gallery-motion": motion,
    "#gallery-view": view,
    "#gallery-hint": hint,
    "#gallery-status": status,
  };
  document.querySelector = (selector) => elements[selector];
  document.createElement = () => new Element();
  const media = new Element();
  media.matches = reduced;
  class Renderer {
    constructor() {
      this.shadowMap = {};
      this.capabilities = { getMaxAnisotropy: () => 4 };
      this.info = { render: { calls: 0, triangles: 0 } };
      this.renders = 0;
      renderers.push(this);
    }
    setPixelRatio(value) {
      this.ratio = value;
    }
    setSize(width, height) {
      this.width = width;
      this.height = height;
    }
    render(scene) {
      this.renders++;
      const info = { calls: 0, triangles: 0 };
      scene.traverse((object) => {
        if (object.isMesh) {
          info.calls++;
          info.triangles +=
            ((object.geometry.index?.count ||
              object.geometry.attributes.position.count) /
              3) *
            (object.isInstancedMesh ? object.count : 1);
        }
      });
      this.info.render = info;
    }
    dispose() {}
  }
  class Loader {
    load(url, callback) {
      callback(new THREE.Texture());
    }
  }
  class Observer {
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }
    observe() {}
  }
  const window = new Element();
  window.THREE = {
    ...THREE,
    WebGLRenderer: Renderer,
    TextureLoader: Loader,
    VideoTexture: class extends THREE.Texture {
      constructor(image) {
        super(image);
        this.isVideoTexture = true;
      }
    },
  };
  const context = vm.createContext({
    window,
    document,
    navigator: {
      deviceMemory: memory,
      hardwareConcurrency: 8,
      connection: { saveData, effectiveType: "4g" },
    },
    matchMedia: () => media,
    devicePixelRatio: 2.5,
    requestAnimationFrame: (callback) => {
      frames.set(++frameId, callback);
      return frameId;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    IntersectionObserver: Observer,
    ResizeObserver: class {
      observe() {}
    },
    performance: { now: () => 0 },
    console,
  });
  vm.runInContext(source, context);
  return {
    stage,
    canvas,
    video,
    motion,
    view,
    document,
    window,
    media,
    frames,
    renderers,
    visible: (value) => observers[0].callback([{ isIntersecting: value }]),
  };
}

const normal = host();
assert.equal(
  normal.renderers.length,
  0,
  "Do not create a renderer before visibility",
);
normal.visible(true);
assert.equal(normal.stage.classList.contains("is-ready"), true);
assert.ok(
  Number(normal.stage.dataset.drawCalls) <= 16,
  "Keep the scene within a small draw-call budget",
);
assert.ok(
  Number(normal.stage.dataset.triangles) < 12000,
  "Do not import the full RAY scene",
);
assert.ok(
  normal.renderers[0].width *
    normal.renderers[0].height *
    normal.renderers[0].ratio ** 2 <=
    1350001,
);
assert.equal(normal.video.paused, false);
await normal.video.fire("loadeddata");
normal.visible(false);
assert.equal(normal.video.paused, true);
assert.equal(normal.frames.size, 0, "Off-screen rendering must stop");
normal.visible(true);
assert.equal(normal.video.paused, false);
normal.document.hidden = true;
await normal.document.fire("visibilitychange");
assert.equal(normal.video.paused, true);
assert.equal(normal.frames.size, 0, "Hidden tabs must stop rendering");

for (const policy of [{ reduced: true }, { saveData: true }]) {
  const quiet = host(policy);
  quiet.visible(true);
  assert.equal(
    quiet.renderers.length,
    0,
    "Quiet mode starts with the static gallery",
  );
  assert.equal(quiet.motion.textContent, "Enable 3D");
  await quiet.view.fire("click");
  assert.equal(quiet.stage.classList.contains("is-ready"), true);
  assert.equal(
    quiet.video.getAttribute("src"),
    null,
    "A static-view request must not download video",
  );
}
const lowMemory = host({ memory: 4 });
lowMemory.visible(true);
assert.equal(lowMemory.renderers[0].shadowMap.enabled, false);
assert.ok(lowMemory.renderers[0].ratio <= 1.15);
await lowMemory.canvas.fire("webglcontextlost", { preventDefault() {} });
assert.equal(lowMemory.stage.classList.contains("is-ready"), false);
assert.equal(lowMemory.frames.size, 0);

console.log(
  "Pass: visible-only renderer, geometry/pixel budgets, off-screen and hidden-tab pause, reduced-motion/data-saving static start, explicit static 3D view, low-memory shadow budget and context-loss fallback.",
);
