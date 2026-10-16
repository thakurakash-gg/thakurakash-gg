/* Static fittings retain exact corners; pitched roofs have continuous planar faces and sharp creases. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const T = require(path.join(root, "assets/three.min.js"));
const state = { window: { THREE: T } };
for (const name of [
  "data/neighborhood.js",
  "environment/neighborhood.js",
  "environment/villas.js",
  "core/batching.js",
])
  vm.runInNewContext(fs.readFileSync(path.join(root, "assets/ray", name), "utf8"), state);
const data = state.window.RayMapData;
const world = { scene: new T.Scene(), canvas: { dataset: {} }, box() {} };
const context = new state.window.RayCleanContext(world, data);
const material = new T.MeshStandardMaterial({ vertexColors: true });
const expected = [];
for (let i = 0; i < 500; i++) {
  const angle = i * 0.13,
    edge = [Math.cos(angle), Math.sin(angle)],
    normal = [-edge[1], edge[0]];
  const geometry = context.villaQuad(
    [100 + (i % 25), 3, 100 + Math.floor(i / 25)],
    edge,
    normal,
    1.7,
    2.2,
    0.047,
  );
  context.color(geometry, 0x435c69);
  expected.push(Array.from(geometry.attributes.position.array));
  context.add("villa-garage-doors", geometry, material);
}
context.flush();
assert.equal(world.scene.children.length, 1, "Same-material nearby gates should share one mesh");
const mesh = world.scene.children[0],
  geometry = mesh.geometry;
assert(!mesh.isInstancedMesh, "Two-triangle fittings must use baked vertex positions");
assert.equal(geometry.attributes.position.count, 500 * 4);
assert.equal(geometry.index.count, 500 * 6);
for (let q = 0; q < 500; q++)
  for (let j = 0; j < 6; j++) {
    const vertex = geometry.index.getX(q * 6 + j);
    const p = [
      geometry.attributes.position.getX(vertex),
      geometry.attributes.position.getY(vertex),
      geometry.attributes.position.getZ(vertex),
    ];
    for (let k = 0; k < 3; k++)
      assert(
        Math.abs(p[k] - expected[q][j * 3 + k]) < 1e-6,
        "A merged gate moved or changed shape",
      );
  }
assert.equal(Number(world.canvas.dataset.villaFittingBytes), 500 * 104);

// Exercise the complete production villa population, including neighborhood
// boundaries and real garage/window material splits.
const populationWorld = { scene: new T.Scene(), canvas: { dataset: {} }, box() {} };
const population = new state.window.RayCleanContext(populationWorld, data);
population.villaMats = Object.fromEntries(
  [
    "wall",
    "tile",
    "metal",
    "flat",
    "frame",
    "glass",
    "garage",
    "door",
    "drive",
    "pool",
    "coping",
  ].map((name) => [name, new T.MeshStandardMaterial({ name, vertexColors: true })]),
);
for (const building of data.buildings) if (building.v) population.villa(building);
population.flush();
const fittingMeshes = populationWorld.scene.children.filter((mesh) =>
  mesh.name.startsWith("Merged villa fittings /"),
);
assert.equal(populationWorld.canvas.dataset.villaFittingQuads, "38782");
assert.equal(populationWorld.canvas.dataset.villaFittingInstances, "0");
assert.equal(fittingMeshes.length, 34);
for (const mesh of fittingMeshes) {
  assert(!mesh.isInstancedMesh);
  const geometry = mesh.geometry;
  assert(geometry.boundingSphere.radius < 350, "Merged fittings lost neighborhood culling");
  assert(
    geometry.index.array instanceof Uint16Array || geometry.index.array instanceof Uint32Array,
  );
  for (const value of geometry.attributes.normal.array) assert(Number.isFinite(value));
}
for (const mesh of populationWorld.scene.children) mesh.geometry.dispose();
for (const material of Object.values(population.villaMats)) material.dispose();

let count = 0,
  triangles = 0,
  maxPlaneError = 0;
for (const building of data.buildings) {
  const v = building.v;
  if (!v) continue;
  triangles += v.tri.length / 3;
  if (v.style === 4) continue;
  count++;
  assert(v.roofPlanes?.length > 0, "Pitched roof still uses the unconstrained square height grid");
  const heightByPoint = new Map();
  for (let i = 0; i < v.roof.length; i += 3) {
    const key = v.roof[i] + "," + v.roof[i + 1];
    if (heightByPoint.has(key))
      assert(Math.abs(heightByPoint.get(key) - v.roof[i + 2]) <= 1, "A ridge contains a crack");
    heightByPoint.set(key, v.roof[i + 2]);
  }
  let start = 0;
  for (const [end, nx, ny, nz] of v.roofPlanes) {
    assert(end >= start && end <= v.tri.length && end % 3 === 0);
    assert(Math.abs(Math.hypot(nx, ny, nz) - 1) < 1e-5 && ny > 0.8);
    const vertex = (id) =>
      new T.Vector3(
        v.roof[id * 3] / v.roofScale,
        v.roof[id * 3 + 2] / v.roofHeightScale,
        v.roof[id * 3 + 1] / v.roofScale,
      );
    const first = vertex(v.tri[start]);
    for (let i = start; i < end; i++) {
      const p = vertex(v.tri[i]).sub(first);
      const error = Math.abs(p.x * nx + p.y * ny + p.z * nz);
      maxPlaneError = Math.max(maxPlaneError, error);
      assert(error < 0.0025, "A triangulation diagonal breaks a planar roof slope");
    }
    start = end;
  }
  assert.equal(start, v.tri.length);
}
assert.equal(count, 1302);
assert(triangles < 40000, "Sharp roofs must not reintroduce a dense height grid");
console.log(
  `Pass: merged gate positions/indices, 104-byte quad buffers and all 38,782 fittings in 34 spatial batches; ${count} pitched roofs use sharp planar faces (${triangles} total roof triangles, max plane error ${maxPlaneError.toFixed(5)} m).`,
);
