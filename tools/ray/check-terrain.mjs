/* Check rendered triangle coverage, including the former self-intersecting coastal contour. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const state = { window: { THREE: require(path.join(root, "assets/three.min.js")) } };
for (const file of ["data/neighborhood.js", "environment/neighborhood.js"])
  vm.runInNewContext(fs.readFileSync(path.join(root, "assets/ray", file), "utf8"), state);
const data = state.window.RayMapData,
  context = new state.window.RayCleanContext({}, data);
const ringArea = (r) =>
  Math.abs(
    r.reduce((sum, p, i) => {
      const q = r[(i + 1) % r.length];
      return sum + p[0] * q[1] - q[0] * p[1];
    }, 0) / 2,
  );
for (const key of ["groundSurfaces", "projectGround"])
  for (const [index, rings] of data[key].entries()) {
    const expected = ringArea(rings[0]) - rings.slice(1).reduce((s, r) => s + ringArea(r), 0);
    const geometry = context.surface(rings, 1.18).toNonIndexed(),
      p = geometry.attributes.position;
    let area = 0;
    for (let i = 0; i < p.count; i += 3) {
      const ax = p.getX(i + 1) - p.getX(i),
        az = p.getZ(i + 1) - p.getZ(i),
        bx = p.getX(i + 2) - p.getX(i),
        bz = p.getZ(i + 2) - p.getZ(i);
      area += Math.abs(ax * bz - az * bx) / 2;
    }
    assert(
      Math.abs(area - expected) < Math.max(0.5, expected * 1e-6),
      `${key} ${index} loses or crosses ground in triangulation: ${area - expected} m²`,
    );
    geometry.dispose();
  }
console.log(
  "Pass: rendered coastal ground triangles cover the valid contours without the former missing wedge.",
);
