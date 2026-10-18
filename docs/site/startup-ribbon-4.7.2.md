# Studio 4.7.2 — ribbon, copy and first-load corrections

The sageo uses wide burgundy fabric strips instead of thin patterned tubes. Three wraps, a compact square knot and short offset tails share one merged mesh. A neutral woven texture supplies surface detail and the material supplies its color.

The opening no longer includes Scroll to explore or Inside the studio. The studio heading uses a non-breaking space in What if ?.

The loading mismatch came from the separate older fallback illustration: it was visible before the current 3D canvas became ready, and its old diagonal layout did not match the current scene. Normal startup now keeps the static artwork hidden. The complete 3D model compiles before its entrance clock starts, avoiding first-frame shader compilation consuming part of the action. There is no additional loading timer. A revised horizontal black/gold/burgundy SVG is shown only when WebGL is unavailable. Context loss returns the canvas to the opening and restores the native text, keeping the fallback out of the fixed header overlay.

Browser verification:
- A fresh normal load hides the fallback while assembling, then settles at the position above the large wordmark without console errors.
- A temporary local page without the Three.js runtime exercises the unavailable-WebGL path: the matching still appears horizontally above the wordmark and the unavailable drawing control is hidden. The temporary QA page was removed after checking.
- The removed labels are absent from the DOM. The added question-mark space is visible at the studio heading.
- The cloth knot is compact, colored, and remains part of the dissolving scabbard group.

Existing route, identity, closed-geometry, entrance, touch-input and reversible-flight checks remain the release checks. RAY is unchanged.
