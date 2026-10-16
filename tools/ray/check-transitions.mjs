import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  THREE = require("../../assets/three.min.js");
class World {}
World.prototype.prepareGlassEnvironments = async function () {};
World.prototype.useGlassEnvironment = function () {};
World.prototype.updateLight = function () {
  return true;
};
vm.runInNewContext(
  fs.readFileSync(
    new URL("../../assets/ray/architecture/glass-transition.js", import.meta.url),
    "utf8",
  ),
  { window: { THREE, RayWorld: World } },
);
const world = new World(),
  texture = {},
  material = new THREE.MeshStandardMaterial({ envMap: texture });
let target = null,
  renders = 0;
Object.assign(world, {
  glassBlendTarget: { texture },
  glassBlendWeights: [1, 0, 0, 0],
  glassBlendUniforms: { weights: { value: new THREE.Vector4() } },
  mood: "afternoon",
  canvas: { dataset: {} },
  modelMaterials: new Set([material]),
  renderer: {
    shadowMap: { needsUpdate: true },
    getRenderTarget: () => target,
    setRenderTarget: (t) => (target = t),
    render() {
      renders++;
    },
  },
});
world.updateGlassBlend(0.016);
assert(
  Math.abs(world.glassBlendWeights[1] - 0.048) < 1e-8,
  "A 16 ms frame must fade, not swap, environments",
);
assert.equal(material.envMap, texture);
assert.equal(target, null);
assert.equal(world.renderer.shadowMap.needsUpdate, true);
world.mood = "night";
world.updateGlassBlend(0.016);
assert(
  world.glassBlendWeights[0] > 0 &&
    world.glassBlendWeights[1] > 0 &&
    world.glassBlendWeights[3] > 0,
  "Interrupting a fade must preserve its existing mixture",
);
for (let frame = 0; frame < 300; frame++) world.updateGlassBlend(0.016);
assert(Math.abs(world.glassBlendWeights.reduce((a, b) => a + b, 0) - 1) < 1e-9);
assert(world.glassBlendWeights[3] > 0.99999);
const settled = renders;
world.updateGlassBlend(0.016);
assert.equal(renders, settled, "Settled light must not draw another atlas pass");
assert.equal(material.envMap, texture);
class Context {
  build() {
    return this;
  }
  roadSurfaceHeight() {
    return 1.3;
  }
}
World.prototype.createMaterials = function () {};
vm.runInNewContext(
  fs.readFileSync(new URL("../../assets/ray/environment/night.js", import.meta.url), "utf8"),
  { window: { THREE, RayWorld: World, RayCleanContext: Context } },
);
const context = new Context();
context.w = {
  scene: new THREE.Scene(),
  skyUniforms: { night: { value: 1 } },
  canvas: { dataset: {} },
};
context.d = {
  roads: [
    {
      n: "Northeast 123rd Street",
      k: "primary",
      p: [
        [-100, 0],
        [0, 0],
      ],
      o: true,
    },
    {
      n: "Broad Causeway",
      k: "primary",
      p: [
        [0, 0],
        [100, 0],
      ],
      b: true,
    },
    {
      n: "96th Street",
      k: "primary",
      p: [
        [100, 0],
        [200, 0],
      ],
    },
    {
      n: "Biscayne Boulevard",
      k: "primary",
      p: [
        [0, 100],
        [100, 100],
      ],
    },
    {
      n: "Local Street",
      k: "residential",
      p: [
        [0, 200],
        [100, 200],
      ],
    },
  ],
};
context.build();
const mesh = context.w.nightRoads,
  p = mesh.geometry.attributes.position;
assert.equal(JSON.parse(context.w.canvas.dataset.nightRoads).majorSegments, 3);
assert.equal(JSON.parse(context.w.canvas.dataset.nightRoads).localSegments, 0);
assert.equal(p.count, 18);
const a = new THREE.Vector3().fromBufferAttribute(p, 0),
  b = new THREE.Vector3().fromBufferAttribute(p, 1),
  c = new THREE.Vector3().fromBufferAttribute(p, 2);
assert(
  new THREE.Vector3().crossVectors(b.sub(a), c.sub(a)).y > 0,
  "Guidance ribbon must face the sky",
);
console.log(
  "Pass: continuous interrupted HDR fades, persistent glazing binding, settled-pass suppression, and complete bridge route with local streets excluded.",
);
