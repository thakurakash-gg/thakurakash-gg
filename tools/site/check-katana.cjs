const assert = require("node:assert/strict");
const G = require("../../assets/home/katana-geometry.js");
for (const [name, data] of [
  ["blade", G.bladeData()],
  ["sheath", G.sheathData()],
]) {
  assert(data.positions.every(Number.isFinite), `${name}: finite vertices`);
  assert(data.groups.length <= 3, `${name}: materials batched`);
  const edges = new Map();
  for (let i = 0; i < data.indices.length; i += 3) {
    const tri = data.indices.slice(i, i + 3);
    const [a, b, c] = tri.map((index) =>
      data.positions.slice(index * 3, index * 3 + 3),
    );
    const u = b.map((v, j) => v - a[j]),
      v = c.map((n, j) => n - a[j]);
    const area = Math.hypot(
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    );
    assert(area > 1e-10, `${name}: no collapsed triangles`);
    for (let j = 0; j < 3; j++) {
      const key = [tri[j], tri[(j + 1) % 3]].sort((a, b) => a - b).join(":");
      edges.set(key, (edges.get(key) || 0) + 1);
    }
  }
  assert(
    [...edges.values()].every((n) => n === 2),
    `${name}: welded, closed surfaces`,
  );
  console.log(
    `${name}: ${data.positions.length / 3} vertices, ${data.indices.length / 3} triangles, ${data.groups.length} material batches; closed and nondegenerate`,
  );
}
// Rigid extraction must stay exactly on the cavity spine at every intermediate frame.
for (let draw = 0; draw <= 1; draw += 0.025)
  for (let s = G.bladeStart; s <= 0; s += 0.1) {
    const p = G.point(s),
      pose = G.pose(draw),
      target = G.point(s + draw * G.travel);
    const x =
      p[0] * Math.cos(pose.angle) - p[1] * Math.sin(pose.angle) + pose.x;
    const y =
      p[0] * Math.sin(pose.angle) + p[1] * Math.cos(pose.angle) + pose.y;
    assert(
      Math.hypot(x - target[0], y - target[1]) < 1e-10,
      "Blade follows sheath cavity",
    );
  }
assert(G.bladeStart + G.travel > G.mouth, "Tip fully clears mouth");
console.log(
  "Extraction stays concentric with the sheath and fully clears its open mouth.",
);
