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
const centralTriangles = [];
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
      const tri = [0, 1, 2].map((k) => [p.getX(i + k), p.getZ(i + k)]);
      if (
        Math.max(...tri.map((v) => v[0])) > 11.017 &&
        Math.min(...tri.map((v) => v[0])) < 24.973 &&
        Math.max(...tri.map((v) => v[1])) > 28.5 &&
        Math.min(...tri.map((v) => v[1])) < 30.5
      )
        centralTriangles.push(tri);
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
// Check actual triangulation, not just polygon vertices, at the curved wall.
const repair = JSON.parse(fs.readFileSync(path.join(root, "docs/ray/seawall-ground-repair.json")));
const cutGeometry = context.surface([repair.cut], 1.18).toNonIndexed();
const cp = cutGeometry.attributes.position,
  cutTriangles = [];
for (let i = 0; i < cp.count; i += 3) {
  const tri = [0, 1, 2].map((k) => [cp.getX(i + k), cp.getZ(i + k)]);
  if (ringArea(tri) > 1e-7) cutTriangles.push(tri);
}
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
function intersectionArea(subject, clip) {
  let out = subject;
  const direction = Math.sign(cross(...clip));
  for (let i = 0; i < 3 && out.length; i++) {
    const a = clip[i],
      b = clip[(i + 1) % 3],
      input = out;
    out = [];
    for (let j = 0; j < input.length; j++) {
      const p = input[j],
        q = input[(j + 1) % input.length];
      const dp = cross(a, b, p) * direction,
        dq = cross(a, b, q) * direction;
      if (dp >= 0) out.push(p);
      if (dp >= 0 !== dq >= 0) {
        const t = dp / (dp - dq);
        out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
    }
  }
  return out.length < 3 ? 0 : ringArea(out);
}
const overlap = centralTriangles.reduce(
  (sum, tri) => sum + cutTriangles.reduce((s, cut) => s + intersectionArea(tri, cut), 0),
  0,
);
assert(
  overlap < 0.001,
  "Generated ground must not protrude through the curved central wall: " + overlap + " m²",
);
cutGeometry.dispose();
console.log(
  "Pass: central seawall land-cap overlap is below 0.001 m²; authored wall and mapped coast remain intact.",
);
