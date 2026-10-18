/* A short assembly beat, independent of page loading and input controls. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.KazeyamiKatanaIntro = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const duration = 0.94;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  function pose(seconds) {
    const time = Math.max(0, seconds);
    if (time >= duration)
      return {
        active: false,
        draw: 0,
        hiltX: 0,
        steelX: 0,
        hiltRoll: 0,
        steelRoll: 0,
        sheathRoll: 0,
        kick: 0,
      };
    const assembly = clamp(time / 0.26);
    const join = 1 - Math.pow(1 - assembly, 4);
    const insertion = clamp((time - 0.29) / 0.43);
    const impact = Math.max(0, time - 0.72);
    return {
      active: true,
      draw: 1 - Math.pow(insertion, 2.6),
      hiltX: -18 * (1 - join),
      steelX: 16 * (1 - join),
      hiltRoll: -0.23 * (1 - join),
      steelRoll: 0.19 * (1 - join),
      sheathRoll: -0.11 * (1 - join),
      kick:
        time >= 0.72
          ? Math.sin(impact * 75) * Math.exp(-impact * 20) * 0.045
          : 0,
    };
  }
  return { duration, pose };
});
