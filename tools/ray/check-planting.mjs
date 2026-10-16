import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const context = { window: { THREE: require(path.join(root, "assets/three.min.js")) } };
for (const file of ["data/neighborhood.js", "data/extra-trees.js", "environment/neighborhood.js"])
  vm.runInNewContext(fs.readFileSync(path.join(root, "assets/ray", file), "utf8"), context);
const data = context.window.RayMapData;
const viewer = new context.window.RayCleanContext({}, data);
const trees = [...data.trees, ...context.window.RayExtraTrees];

const segmentDistance = (x, z, a, b) => {
  const dx = b[0] - a[0],
    dz = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)),
  );
  return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
};
const cross = (a, b, x, z) => (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]);
function overlaps(x, z, radius, triangle) {
  const [a, b, c] = triangle;
  if (Math.abs(cross(a, b, c[0], c[1])) < 1e-8) return false;
  const signs = [cross(a, b, x, z), cross(b, c, x, z), cross(c, a, x, z)];
  return (
    signs.every((v) => v >= 0) ||
    signs.every((v) => v <= 0) ||
    Math.min(
      segmentDistance(x, z, a, b),
      segmentDistance(x, z, b, c),
      segmentDistance(x, z, c, a),
    ) < radius
  );
}
assert(
  overlaps(1, 1, 0, [
    [0, 0],
    [4, 0],
    [0, 4],
  ]),
);
assert(
  overlaps(2, -1, 1.1, [
    [0, 0],
    [4, 0],
    [0, 4],
  ]),
);
assert(
  !overlaps(2, -2, 1.1, [
    [0, 0],
    [4, 0],
    [0, 4],
  ]),
);
function indexSurface(kind) {
  const cells = new Map();
  const insert = (triangle) => {
    for (
      let x = Math.floor(Math.min(...triangle.map((p) => p[0])) / 20);
      x <= Math.floor(Math.max(...triangle.map((p) => p[0])) / 20);
      x++
    )
      for (
        let z = Math.floor(Math.min(...triangle.map((p) => p[1])) / 20);
        z <= Math.floor(Math.max(...triangle.map((p) => p[1])) / 20);
        z++
      ) {
        const key = `${x},${z}`;
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(triangle);
      }
  };
  const mesh = data[kind + "Mesh"],
    vertices = mesh.vertices;
  for (let i = 0; i < mesh.indices.length; i += 3)
    insert(mesh.indices.slice(i, i + 3).map((id) => [vertices[id * 3], vertices[id * 3 + 1]]));
  for (const rings of data[kind === "road" ? "roadSurfaces" : "pavingSurfaces"]) {
    const geometry = viewer.surface(rings, 0).toNonIndexed(),
      p = geometry.attributes.position;
    for (let i = 0; i < p.count; i += 3)
      insert([0, 1, 2].map((j) => [p.getX(i + j), p.getZ(i + j)]));
    geometry.dispose();
  }
  return (x, z, radius) => {
    for (let a = Math.floor((x - radius) / 20); a <= Math.floor((x + radius) / 20); a++)
      for (let b = Math.floor((z - radius) / 20); b <= Math.floor((z + radius) / 20); b++)
        if ((cells.get(`${a},${b}`) || []).some((t) => overlaps(x, z, radius, t))) return true;
    return false;
  };
}
const road = indexSurface("road"),
  paving = indexSurface("paving");
function insideRing(x, z, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (a[1] > z !== b[1] > z && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0])
      inside = !inside;
  }
  return inside;
}
for (const [i, [x, z]] of trees.entries()) {
  assert(!road(x, z, 3.45), `Tree ${i} intrudes into rendered road clearance`);
  assert(!paving(x, z, 1.6), `Tree ${i} intrudes into rendered sidewalk clearance`);
  assert(
    [...data.groundSurfaces, ...data.gardenBeds].some(
      (r) => insideRing(x, z, r[0]) && !r.slice(1).some((h) => insideRing(x, z, h)),
    ),
    `Tree ${i} is outside green ground`,
  );
}
assert.equal(trees.length, 5693);
console.log(
  "Pass: 5,693 tree bases on green ground, outside all rendered road and paving meshes with clearance.",
);
