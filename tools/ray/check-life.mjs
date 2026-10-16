import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const THREE = require(path.join(root, "assets/three.min.js"));
class World {}
const window = { THREE, RayWorld: World };
vm.runInNewContext(
  fs.readFileSync(path.join(root, "assets/ray/data/building-landscape.js"), "utf8"),
  { window },
);
vm.runInNewContext(fs.readFileSync(path.join(root, "assets/ray/architecture/life.js"), "utf8"), {
  window,
});
const world = new World();
Object.assign(world, {
  scene: new THREE.Scene(),
  modelRoot: new THREE.Group(),
  boxGeometry: new THREE.BoxGeometry(),
  canvas: { dataset: {} },
  time: 0,
});
const d = window.RayBuildingLandscape;
world.alignProjectItem = ({ x, z }) => ({
  x: x * Math.cos(d.buildingYaw) + z * Math.sin(d.buildingYaw),
  z: -x * Math.sin(d.buildingYaw) + z * Math.cos(d.buildingYaw) + d.buildingShift,
});
world.createResidents();
assert.equal(world.residents.people.length, 31);
assert.equal(
  Object.keys(world.residents.parts).length,
  5,
  "Residents must share five geometry/material batches",
);
const before = Float32Array.from(world.residents.parts.shirt.instanceMatrix.array);
world.time = 4.25;
world.updateResidents();
const after = Float32Array.from(world.residents.parts.shirt.instanceMatrix.array);
assert(after.every(Number.isFinite), "Resident animation produced a non-finite transform");
assert.notDeepEqual(after.slice(0, 16), before.slice(0, 16), "Walking residents must advance");
const stationary = world.residents.people.findIndex((person) => !person.walking);
for (const offset of [12, 13, 14])
  assert.equal(
    after[stationary * 3 * 16 + offset],
    before[stationary * 3 * 16 + offset],
    "Standing residents must keep their feet in place",
  );
world.updateResidents();
assert.deepEqual(
  world.residents.parts.shirt.instanceMatrix.array,
  after,
  "A paused animation time must produce a stable pose",
);
for (const mesh of Object.values(world.residents.parts)) {
  assert(mesh.instanceMatrix.array.every(Number.isFinite));
  assert(
    mesh.geometry.index.count / 3 < 1000,
    "Resident parts must remain suitable for aerial viewing",
  );
}
const frond = world.projectPalmFrond();
assert(frond.attributes.position.array.every(Number.isFinite));
assert(
  frond.attributes.position.count / 3 <= 100,
  "Palm fronds must retain a modest geometry budget",
);
assert.equal(frond, world.projectPalmFrond(), "Palms must reuse their frond geometry");
console.log(
  "Pass: finite resident animation, anchored standing poses, paused poses, five shared resident batches, and reusable palm geometry.",
);
