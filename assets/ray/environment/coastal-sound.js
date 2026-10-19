/* Optional coastal field recordings: isolated cues separated by genuine silence. */
(() => {
  "use strict";
  function planCue(random, mood, previous) {
    const kind =
      random() < (mood === "night" ? 0.15 : 0.45) ? "gulls" : "shore";
    const duration = kind === "gulls" ? 3 : 5;
    const count = kind === "gulls" ? 3 : 2;
    const choices = Array.from({ length: count }, (_, index) => index).filter(
      (index) => `${kind}-${index}` !== previous,
    );
    const index = choices[Math.floor(random() * choices.length)];
    return {
      id: `${kind}-${index}`,
      kind,
      offset: index * duration,
      duration,
      gain: (kind === "gulls" ? 0.19 : 0.27) * (0.8 + random() * 0.2),
      rate: 0.98 + random() * 0.04,
      gap: 18000 + random() * 27000,
    };
  }
  if (typeof module !== "undefined") module.exports = { planCue };
  if (typeof document === "undefined") return;
  const button = document.getElementById("sound-toggle");
  const scene = document.getElementById("scene");
  if (!button || !scene) return;
  let context, buffers, loading, timer, source, previous;
  let enabled = false,
    request = 0;
  const active = () => enabled && !document.hidden;
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
      ? "Coastal sounds on · occasional, quiet gulls and waves"
      : "Enable quiet coastal sounds";
  }
  function stop() {
    clearTimeout(timer);
    timer = null;
    if (source) {
      const current = source;
      source = null;
      current.stop();
    }
    button.dataset.soundState = enabled ? "waiting" : "off";
  }
  async function load() {
    if (buffers) return;
    loading ??= Promise.all(
      ["gulls", "shore"].map(async (kind) => {
        const path = `assets/ray/audio/coast-${kind}.mp3`;
        const response = await fetch(window.RayAssets.get(path));
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
    const cue = planCue(Math.random, scene.dataset.mood, previous);
    previous = cue.id;
    const node = context.createBufferSource();
    const gain = context.createGain();
    node.buffer = buffers[cue.kind];
    node.loop = false;
    node.playbackRate.value = cue.rate;
    gain.gain.value = cue.gain;
    node.connect(gain).connect(context.destination);
    source = node;
    button.dataset.soundState = "playing";
    button.dataset.soundCue = cue.id;
    node.onended = () => {
      node.disconnect();
      gain.disconnect();
      if (source !== node) return;
      source = null;
      schedule(cue.gap);
    };
    node.start(0, cue.offset, cue.duration);
  }
  button.addEventListener("click", async () => {
    const currentRequest = ++request;
    enabled = !enabled;
    stop();
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
      schedule(1000 + Math.random() * 2000);
      announce(
        "Quiet coastal sounds on, with silent gaps between calls and waves.",
      );
    } catch {
      enabled = false;
      stop();
      update();
      loading = null;
      announce("Coastal sounds are unavailable. You can continue exploring.");
    }
  });
  document.addEventListener("visibilitychange", async () => {
    stop();
    if (document.hidden) context?.suspend().catch(() => {});
    else if (enabled) {
      await context?.resume().catch(() => {});
      schedule(6000 + Math.random() * 12000);
    }
  });
  window.addEventListener("pagehide", () => {
    enabled = false;
    stop();
    update();
    context?.suspend().catch(() => {});
  });
  update();
})();
