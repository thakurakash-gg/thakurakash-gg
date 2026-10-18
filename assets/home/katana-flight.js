/* Draw first, then dock the blade. Seconds-based motion is frame-rate independent. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.KazeyamiKatanaFlight = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const smooth = (x) => {
    x = clamp(x);
    return x * x * (3 - 2 * x);
  };
  return function createFlight() {
    let elapsed = 0;
    return {
      update(dt, { draw, target, dragging, assembling, reduced }) {
        // A held drag and the opening assembly must never launch the docking motion.
        if (target < 0.5) elapsed = reduced ? 0 : Math.max(0, elapsed - dt * 2);
        else if (!assembling && !dragging && draw >= 0.94)
          elapsed = reduced ? 2.1 : Math.min(2.1, elapsed + dt);
        const progress = smooth(elapsed / 2.1);
        return {
          progress,
          hilt: smooth((progress - 0.28) / 0.64),
          sheath: smooth((progress - 0.04) / 0.48),
          moving: elapsed > 0 && elapsed < 2.1,
        };
      },
    };
  };
});
