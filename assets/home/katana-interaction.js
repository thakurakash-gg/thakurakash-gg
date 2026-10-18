/* Input intent stays separate from the animated blade position. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.KazeyamiKatanaInteraction = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const clamp = (value) => Math.max(0, Math.min(1, value));
  return function createInteraction() {
    let progress = 0,
      manual = null,
      origin = 0,
      pointer = null;
    const target = () => manual ?? clamp(progress * 2.2);
    const setManual = (value) => {
      manual = clamp(value);
      origin = progress;
    };
    const toggle = () => {
      setManual(target() >= 0.5 ? 0 : 1);
      return target();
    };
    return {
      target,
      toggle,
      isDragging: () => Boolean(pointer?.dragging),
      scroll(value) {
        progress = clamp(value);
        if (manual !== null && Math.abs(progress - origin) > 0.025)
          manual = null;
      },
      down({ id, x, y, type, draw }) {
        pointer = { id, x, y, lastX: x, lastY: y, type, draw, dragging: false };
      },
      move({ id, x, y, width }) {
        if (!pointer || id !== pointer.id) return false;
        pointer.lastX = x;
        pointer.lastY = y;
        const dx = x - pointer.x,
          dy = y - pointer.y;
        // Lock touch input to its first deliberate axis, preserving page scrolling.
        if (!pointer.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8)
          pointer.axis =
            Math.abs(dx) > Math.abs(dy) * 1.2 ? "horizontal" : "vertical";
        if (
          (pointer.type !== "touch" && Math.abs(dx) > 6) ||
          pointer.axis === "horizontal"
        )
          pointer.dragging = true;
        if (pointer.dragging) setManual(pointer.draw + (dx / width) * 2);
        return pointer.dragging;
      },
      up({ id, x, y }) {
        if (!pointer || id !== pointer.id) return;
        if (!pointer.dragging && Math.hypot(x - pointer.x, y - pointer.y) < 8)
          toggle();
        if (pointer.dragging) setManual(target() >= 0.35 ? 1 : 0);
        pointer = null;
      },
      cancel() {
        pointer = null;
      },
    };
  };
});
