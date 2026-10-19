/* Camera-aware coastal field recordings. No loops, audio work in the render path,
 * or downloads before opt-in. Short cues follow the viewer's current surroundings. */
(() => {
  "use strict";
  const clamp = (x) => Math.max(0, Math.min(1, x));
  function smooth(a, b, x) {
    const t = clamp((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  }
  function coastSampler(land = []) {
    const edges = land.flatMap((polygon) =>
      polygon.flatMap((ring) => ring.slice(1).map((end, i) => [ring[i], end])),
    );
    function inside(point, ring) {
      let yes = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[i],
          b = ring[j];
        if (
          a[1] > point[1] !== b[1] > point[1] &&
          point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
        )
          yes = !yes;
      }
      return yes;
    }
    return (position) => {
      const p = [position.x, position.z];
      const onLand = land.some(
        (polygon) =>
          inside(p, polygon[0]) &&
          !polygon.slice(1).some((ring) => inside(p, ring)),
      );
      if (!onLand) return Math.abs(position.y);
      let nearest = Infinity;
      for (const [a, b] of edges) {
        const dx = b[0] - a[0],
          dz = b[1] - a[1];
        const t = clamp(
          ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1),
        );
        nearest = Math.min(
          nearest,
          Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz),
        );
      }
      return Math.hypot(position.y, nearest);
    };
  }
  function soundProfile(position, distance, mood) {
    const height = Math.max(0, position.y);
    const water = 1 - smooth(32, 165, distance);
    const birds = smooth(35, 150, height) * (mood === "night" ? 0.4 : 1);
    const wind = clamp(0.16 + 0.84 * smooth(25, 260, height));
    const zone = height < 110 && water > 0.5 ? "waterfront" : "elevated";
    return { height, water, birds, wind, zone };
  }
  const gainFor = (kind, profile) =>
    kind === "shore"
      ? 0.65 * profile.water
      : kind === "gulls"
        ? 0.46 * (0.2 + 0.8 * profile.birds)
        : 0.4 * profile.wind;
  function planCue(random, profile, previous, sequence) {
    const windTurn =
      sequence > 0 && sequence % (profile.height > 230 ? 2 : 3) === 0;
    const kind =
      windTurn && profile.wind > 0.3
        ? "wind"
        : profile.zone === "waterfront"
          ? "shore"
          : "gulls";
    const duration = { shore: 5, gulls: 3, wind: 8 }[kind];
    const count = { shore: 2, gulls: 3, wind: 1 }[kind];
    const choices = Array.from({ length: count }, (_, i) => i).filter(
      (i) => count === 1 || `${kind}-${i}` !== previous,
    );
    const index = choices[Math.floor(random() * choices.length)];
    return {
      id: `${kind}-${index}`,
      kind,
      offset: index * duration,
      duration,
      gain: gainFor(kind, profile) * (0.9 + random() * 0.1),
      rate: 0.99 + random() * 0.02,
      gap: kind === "shore" ? 800 + random() * 2000 : 2000 + random() * 4000,
    };
  }
  if (typeof module !== "undefined")
    module.exports = { coastSampler, soundProfile, planCue };
  if (typeof document === "undefined") return;
  const button = document.getElementById("sound-toggle");
  const scene = document.getElementById("scene");
  if (!button || !scene) return;
  let context, buffers, loading, timer, current, previous, sampler;
  let enabled = false,
    request = 0,
    sequence = 0,
    lastSample = -Infinity;
  let position = { x: 0, y: 100, z: 250 },
    mood = "morning",
    profile;
  const voices = new Set();
  const active = () => enabled && !document.hidden;
  function refresh() {
    sampler ??= coastSampler(window.RayMapData?.land);
    const next = soundProfile(position, sampler(position), mood);
    // A small hysteresis band avoids chatter around the waterfront threshold.
    if (
      profile?.zone === "waterfront" &&
      next.water > 0.43 &&
      next.height < 120
    )
      next.zone = "waterfront";
    else if (
      profile?.zone === "elevated" &&
      (next.water < 0.58 || next.height > 100)
    )
      next.zone = "elevated";
    profile = next;
    button.dataset.soundZone = profile.zone;
    button.dataset.soundWeights = [profile.water, profile.birds, profile.wind]
      .map((x) => x.toFixed(2))
      .join(",");
  }
  function announce(message) {
    const status = document.getElementById("announcement");
    if (status) status.textContent = message;
  }
  function update() {
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute(
      "aria-label",
      enabled ? "Mute coastal sounds" : "Enable coastal sounds",
    );
    button.title = enabled
      ? "Camera-aware waves, birds and wind"
      : "Enable coastal sounds";
  }
  function stopAll() {
    clearTimeout(timer);
    timer = null;
    current = null;
    for (const voice of voices) {
      voice.gain.gain.value = 0;
      voice.node.stop();
    }
    button.dataset.soundState = enabled ? "waiting" : "off";
  }
  async function load() {
    if (buffers) return;
    loading ??= Promise.all(
      ["gulls", "shore", "wind"].map(async (kind) => {
        const response = await fetch(
          window.RayAssets.get(`assets/ray/audio/coast-${kind}.mp3`),
        );
        if (!response.ok) throw Error("Coastal audio unavailable");
        return [
          kind,
          await context.decodeAudioData(await response.arrayBuffer()),
        ];
      }),
    ).then((entries) => {
      buffers = Object.fromEntries(entries);
    });
    return loading;
  }
  function schedule(delay) {
    clearTimeout(timer);
    if (!active() || !buffers) return;
    button.dataset.soundState = "waiting";
    timer = setTimeout(play, delay);
  }
  function play() {
    if (!active()) return;
    refresh();
    const cue = planCue(Math.random, profile, previous, sequence++);
    previous = cue.id;
    const node = context.createBufferSource(),
      gain = context.createGain();
    node.buffer = buffers[cue.kind];
    node.loop = false;
    node.playbackRate.value = cue.rate;
    gain.gain.value = cue.gain;
    node.connect(gain).connect(context.destination);
    const voice = { node, gain, kind: cue.kind };
    current = voice;
    voices.add(voice);
    button.dataset.soundState = "playing";
    button.dataset.soundCue = cue.id;
    node.onended = () => {
      voices.delete(voice);
      node.disconnect();
      gain.disconnect();
      if (current !== voice) return;
      current = null;
      schedule(cue.gap);
    };
    node.start(0, cue.offset, cue.duration);
  }
  window.RayCoastalSound = {
    updateView(camera, lighting, now) {
      position = camera;
      mood = lighting;
      if (!active() || !buffers || now - lastSample < 250) return;
      lastSample = now;
      const oldZone = profile?.zone;
      refresh();
      if (oldZone && oldZone !== profile.zone) {
        // Fade the old surroundings before the new cue, even if the next timer was far away.
        if (current) {
          const old = current;
          current = null;
          old.gain.gain.setTargetAtTime(0, context.currentTime, 0.12);
          old.node.stop(context.currentTime + 0.45);
        }
        sequence = 0;
        schedule(550);
      } else if (current) {
        current.gain.gain.setTargetAtTime(
          gainFor(current.kind, profile),
          context.currentTime,
          0.3,
        );
      }
    },
  };
  button.addEventListener("click", async () => {
    const currentRequest = ++request;
    enabled = !enabled;
    stopAll();
    update();
    if (!enabled) {
      context?.suspend().catch(() => {});
      announce("Coastal sounds off.");
      return;
    }
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      context ??= new Audio();
      await context.resume();
      if (!enabled || currentRequest !== request) return;
      button.dataset.soundState = "loading";
      await load();
      if (!active() || currentRequest !== request) return;
      sequence = 0;
      refresh();
      schedule(350);
      announce(
        "Coastal sounds on. Waves follow the water; birds and wind follow your height.",
      );
    } catch {
      if (currentRequest !== request) return;
      enabled = false;
      stopAll();
      update();
      loading = null;
      announce("Coastal sounds are unavailable. You can continue exploring.");
    }
  });
  document.addEventListener("visibilitychange", async () => {
    stopAll();
    if (document.hidden) context?.suspend().catch(() => {});
    else if (enabled) {
      await context?.resume().catch(() => {});
      sequence = 0;
      refresh();
      schedule(700);
    }
  });
  window.addEventListener("pagehide", () => {
    enabled = false;
    stopAll();
    update();
    context?.suspend().catch(() => {});
  });
  update();
})();
