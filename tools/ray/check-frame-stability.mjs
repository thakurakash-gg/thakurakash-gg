/* Run the real render loop against a canvas that becomes blank whenever its size changes. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const T = require(path.join(root, "assets/three.min.js"));
const state = {
  window: { THREE: T, devicePixelRatio: 2 },
  navigator: { deviceMemory: 8, hardwareConcurrency: 8 },
  innerWidth: 1280,
  innerHeight: 720,
  document: { hidden: false },
  performance: { now: () => 10000 },
};
vm.createContext(state);
for (const name of ["quality.js", "world.js"])
  vm.runInContext(fs.readFileSync(path.join(root, "assets/ray/core", name), "utf8"), state);

function fixture(compact = false) {
  state.navigator.deviceMemory = compact ? 4 : 8;
  state.navigator.hardwareConcurrency = compact ? 4 : 8;
  let ratio = 1.5,
    visible = true;
  const events = [];
  const clear = () => {
    visible = false;
    events.push("resize");
  };
  const world = Object.assign(Object.create(state.window.RayWorld.prototype), {
    canvas: { dataset: {}, clientWidth: compact ? 412 : 1280, clientHeight: compact ? 850 : 720 },
    quality: state.window.RayQuality(),
    frameMs: 45,
    renderCostMs: 30,
    performanceStart: 1,
    performanceSamples: 89,
    last: 9955,
    lastMirror: 10000,
    paused: true,
    time: 1,
    clockUniform: {},
    target: new T.Vector3(0, 33, 0),
    desiredTarget: new T.Vector3(0, 33, 0),
    orbit: { theta: 0.4, phi: 1.2, radius: 270 },
    desired: { theta: 0.4, phi: 1.2, radius: 270 },
    camera: new T.PerspectiveCamera(),
    mirrorCamera: new T.PerspectiveCamera(),
    mirrorTarget: { width: 512, height: 512 },
    textureMatrix: new T.Matrix4(),
    water: { visible: true },
    sky: new T.Object3D(),
    boats: [],
    birds: [],
    scene: {},
    fitFactor: 1,
    updateLight: () => false,
    resizeReflection() {},
    wake() {},
    renderer: {
      getPixelRatio: () => ratio,
      setPixelRatio(value) {
        ratio = value;
        clear();
      },
      setSize: clear,
      setDrawingBufferSize(width, height, value) {
        ratio = value;
        clear();
      },
      setRenderTarget() {},
      render() {
        events.push("offscreen");
      },
    },
    renderPresentation() {
      visible = true;
      events.push("present");
    },
  });
  world.quality.contactShading = false;
  world.quality.reflectionScale = world.quality.reflectionMinimum;
  return { world, events, visible: () => visible, ratio: () => ratio };
}

for (const compact of [false, true]) {
  const test = fixture(compact);
  test.world.render(10000);
  assert(test.ratio() < 1.5, "The test must actually trigger a resolution downgrade");
  assert(test.visible(), "Adaptive sizing erased the completed frame");
  assert.equal(test.events.at(-1), "present", "A canvas clear occurred after presentation");
  test.events.length = 0;
  test.world.resize();
  assert.equal(
    test.events.length,
    0,
    "A viewport event cleared the visible canvas outside rendering",
  );
  test.world.render(10016);
  assert(test.visible());
  assert.equal(test.events.at(-1), "present");

  // Fast frames immediately after a downgrade must not bounce back to higher resolution.
  const ratio = test.ratio();
  test.world.frameMs = 16;
  test.world.renderCostMs = 3;
  for (let now = 10020; now < 39000; now += 16.7)
    state.window.RayAdaptQuality.call(test.world, now);
  assert.equal(test.ratio(), ratio, "Resolution bounced back during the downgrade cooldown");
  for (let now = 39000; now < 95000; now += 16.7)
    state.window.RayAdaptQuality.call(test.world, now);
  assert(test.ratio() > ratio, "Sustained headroom should still restore quality");
  assert(test.world.quality.reflectionScale <= test.world.quality.reflectionMaximum);
}

// Verify that this regression catches the previous frame order, rather than only exercising mocks.
const oldState = { ...state, window: { ...state.window } };
vm.createContext(oldState);
const source = fs.readFileSync(path.join(root, "assets/ray/core/world.js"), "utf8");
const badSource = source
  .replace("window.RayAdaptQuality.call(this, now);", "")
  .replace(
    "this.renderPresentation();",
    "this.renderPresentation(); window.RayAdaptQuality.call(this, now);",
  );
vm.runInContext(badSource, oldState);
const broken = fixture();
oldState.window.RayWorld.prototype.render.call(broken.world, 10000);
assert(!broken.visible(), "The old ordering must reproduce a blank completed frame");
console.log(
  "Pass: adaptive and mobile viewport resizes finish with a rendered image; downgrade cooldown, sustained recovery and compact reflection budget stay stable. Previous ordering reproduces the blank frame.",
);
