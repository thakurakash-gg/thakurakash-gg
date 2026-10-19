import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const code = fs.readFileSync(
  new URL("../../assets/ray/environment/coastal-sound.js", import.meta.url),
  "utf8",
);
const listeners = new Map(),
  timers = new Map(),
  nodes = [],
  attrs = new Map();
let requests = 0,
  contexts = 0,
  timerId = 0;
const button = {
  dataset: {},
  setAttribute: (name, value) => attrs.set(name, value),
  addEventListener: (name, handler) => listeners.set(`button-${name}`, handler),
};
const scene = { dataset: { mood: "afternoon" } },
  status = {};
const document = {
  hidden: false,
  getElementById: (id) => ({ "sound-toggle": button, scene, announcement: status })[id],
  addEventListener: (name, handler) => listeners.set(name, handler),
};
class AudioContext {
  constructor() {
    contexts++;
    this.destination = {};
    this.currentTime = 0;
  }
  async resume() {}
  async suspend() {}
  async decodeAudioData() {
    return {};
  }
  createGain() {
    return { gain: { setTargetAtTime() {} }, connect() {}, disconnect() {} };
  }
  createBufferSource() {
    const node = {
      playbackRate: {},
      connect: () => ({ connect() {} }),
      disconnect() {},
      start(...args) {
        this.started = args;
      },
      stop() {
        this.stopped = true;
        this.onended?.();
      },
    };
    nodes.push(node);
    return node;
  }
}
const sandbox = {
  module: { exports: {} },
  document,
  window: {
    AudioContext,
    RayAssets: { get: (path) => path },
    addEventListener: (name, handler) => listeners.set(name, handler),
  },
  fetch: async () => {
    requests++;
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(0) };
  },
  setTimeout: (handler, delay) => {
    timers.set(++timerId, { handler, delay });
    return timerId;
  },
  clearTimeout: (id) => timers.delete(id),
};
vm.runInNewContext(code, sandbox);
assert.equal(contexts, 0, "No AudioContext before opt-in");
assert.equal(requests, 0, "No audio bytes before opt-in");
assert.equal(timers.size, 0);
assert.equal(attrs.get("aria-pressed"), "false");
const { planCue, coastSampler, soundProfile } = sandbox.module.exports;
const distance = coastSampler([
  [
    [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
      [0, 0],
    ],
  ],
]);
assert.equal(distance({ x: 110, y: 4, z: 50 }), 4, "Water distance follows altitude over the sea");
assert(
  Math.abs(distance({ x: 50, y: 4, z: 50 }) - Math.hypot(50, 4)) < 1e-6,
  "An inland camera includes horizontal distance to water",
);
const low = soundProfile({ y: 8 }, 8, "afternoon");
const high = soundProfile({ y: 300 }, 300, "afternoon");
assert(low.water > high.water && high.birds > low.birds && high.wind > low.wind);
assert.equal(planCue(() => 0.5, low, null, 0).kind, "shore");
assert.equal(planCue(() => 0.5, high, null, 0).kind, "gulls");
assert.equal(planCue(() => 0.5, high, null, 1).kind, "wind");
let previous;
for (let i = 0; i < 1000; i++) {
  const cue = planCue(Math.random, i % 2 ? high : low, previous, i);
  assert.notEqual(cue.id, previous, "Avoid immediately repeated clips");
  assert(cue.gap >= 800 && cue.gap < 6000);
  assert(cue.gain > 0 && cue.gain <= 0.65);
  assert([3, 5, 8].includes(cue.duration));
  previous = cue.id;
}
await listeners.get("button-click")();
assert.equal(contexts, 1);
assert.equal(requests, 3);
assert.equal(timers.size, 1);
let pending = [...timers.entries()][0];
timers.delete(pending[0]);
pending[1].handler();
assert.equal(nodes.length, 1);
assert.equal(nodes[0].loop, false);
assert.equal(timers.size, 0, "Never schedule a second sound over an active cue");
sandbox.window.RayCoastalSound.updateView({ x: 0, y: 8, z: 100 }, "afternoon", 1000);
assert.equal(button.dataset.soundZone, "waterfront");
assert.equal(nodes[0].stopped, true, "Camera transitions fade and retire the old surroundings");
pending = [...timers.entries()][0];
timers.delete(pending[0]);
pending[1].handler();
assert.equal(button.dataset.soundCue.startsWith("shore"), true);
nodes.at(-1).onended();
assert.equal(timers.size, 1);
assert([...timers.values()][0].delay >= 800, "A natural gap starts after the wave ends");
await listeners.get("button-click")();
assert.equal(timers.size, 0, "Mute cancels the next cue");
await listeners.get("button-click")();
assert.equal(requests, 3, "Re-enabling reuses decoded recordings");
document.hidden = true;
await listeners.get("visibilitychange")();
assert.equal(timers.size, 0, "No scheduled sound in a hidden tab");
document.hidden = false;
await listeners.get("visibilitychange")();
assert.equal(timers.size, 1);
listeners.get("pagehide")();
assert.equal(timers.size, 0);
assert.equal(attrs.get("aria-pressed"), "false");
console.log(
  "Pass: distance to water, height-dependent birds and wind, responsive camera transitions, opt-in loading, finite cues, mute and background suspension.",
);
