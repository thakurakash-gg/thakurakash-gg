import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const root = new URL("../../", import.meta.url);
const box = { module: { exports: {} } };
vm.runInNewContext(
  fs.readFileSync(new URL("assets/ray/data/marina-bank-ownership.js", root), "utf8"),
  box,
);
const { cuts, segments } = box.module.exports;
const map = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL("assets/ray/data/neighborhood.js", root), "utf8"), map);
const key = (p, q) => [...p, ...q].map((n) => n.toFixed(3)).join(",");
const edges = new Set(
  map.window.RayMapData.land.flatMap((poly) =>
    poly.flatMap((ring) => ring.slice(1).map((q, i) => key(ring[i], q))),
  ),
);
let removed = 0;
for (const [p, q, spans] of cuts) {
  assert(edges.has(key(p, q)), "Ownership clipping must match an existing coastline edge");
  const length = Math.hypot(q[0] - p[0], q[1] - p[1]);
  const kept = segments(p, q);
  const keptLength = kept.reduce((sum, [a, b]) => sum + Math.hypot(b[0] - a[0], b[1] - a[1]), 0);
  const cutLength =
    length *
    spans.reduce((sum, [a, b]) => {
      assert(a >= 0 && b <= 1 && b >= a);
      return sum + b - a;
    }, 0);
  assert(
    Math.abs(length - keptLength - cutLength) < 1e-6,
    "Keep all unowned bank spans without gaps or reversed endpoints",
  );
  removed += cutLength;
}
assert(removed > 200 && removed < 201, "The authored wall owns the central protruding bank too");
for (const [a,b] of [
  [[11.017,28.909],[19.975,30.2]],
  [[19.975,30.2],[24.973,29.797]],
]) assert.equal(segments(a,b).length,0,"No green bank may remain across the curved central wall");
const p = [1000, 1000],
  q = [1001, 1001];
assert.equal(
  JSON.stringify(segments(p, q)),
  JSON.stringify([[p, q]]),
  "Other coastline geometry stays exact",
);
console.log(
  "Pass: 63 bank spans clipped at the authored wall, including the central bulge; other coast edges and partial spans retained.",
);
