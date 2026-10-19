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
  }
  async resume() {}
  async suspend() {}
  async decodeAudioData() {
    return {};
  }
  createGain() {
    return { gain: {}, connect() {}, disconnect() {} };
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
const { planCue } = sandbox.module.exports;
let previous;
for (let i = 0; i < 1000; i++) {
  const cue = planCue(Math.random, i % 2 ? "night" : "afternoon", previous);
  assert.notEqual(cue.id, previous, "Avoid immediately repeated clips");
  assert(cue.gap >= 18000 && cue.gap < 45000);
  assert(cue.gain > 0 && cue.gain <= 0.27);
  assert([3, 5].includes(cue.duration));
  previous = cue.id;
}
await listeners.get("button-click")();
assert.equal(contexts, 1);
assert.equal(requests, 2);
assert.equal(timers.size, 1);
let pending = [...timers.entries()][0];
timers.delete(pending[0]);
pending[1].handler();
assert.equal(nodes.length, 1);
assert.equal(nodes[0].loop, false);
assert.equal(timers.size, 0, "Never schedule a second sound over an active cue");
nodes[0].onended();
assert.equal(timers.size, 1);
assert([...timers.values()][0].delay >= 18000, "Silence starts after the cue ends");
await listeners.get("button-click")();
assert.equal(timers.size, 0, "Mute cancels the next cue");
await listeners.get("button-click")();
assert.equal(requests, 2, "Re-enabling reuses decoded recordings");
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
  "Pass: opt-in loading, bounded quiet cues, non-overlap, random silence, mute, background suspension and decoded buffer reuse.",
);
