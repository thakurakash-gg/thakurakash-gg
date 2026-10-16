import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const THREE = require(path.join(root, "assets/three.min.js"));
let invalid = false,
  failCapture = false,
  captures = 0,
  conversions = 0;
const targets = [];
class ProbeCamera extends THREE.CubeCamera {
  update(renderer, scene) {
    captures++;
    assert(
      this.children.every((camera) => camera.far > 8000),
      "The reflection camera must include the sky sphere",
    );
    assert.equal(
      world.waterUniforms[0].reflectionPass.value,
      1,
      "Cubemap water must not sample a main-camera planar reflection",
    );
    assert.equal(world.modelRoot.visible, false);
    assert.equal(addition.visible, false, "Added glazing must not sample its own capture");
    if (failCapture) throw Error("Simulated capture failure");
  }
}
class World {}
const window = {
  THREE: { ...THREE, CubeCamera: ProbeCamera },
  RayWorld: World,
  RayBuildingLandscape: { buildingShift: 3.915 },
};
vm.runInNewContext(
  fs.readFileSync(path.join(root, "assets/ray/architecture/rooftops.js"), "utf8"),
  { window },
);
const world = new World();
const material = new THREE.MeshStandardMaterial();
material.userData.rayReflective = true;
const addedMaterial = material.clone();
const addition = new THREE.Mesh(new THREE.BoxGeometry(), addedMaterial);
const scene = new THREE.Scene(),
  originalBackground = new THREE.Color(0x223344);
scene.background = originalBackground;
scene.environment = new THREE.Texture();
const modelRoot = new THREE.Group();
scene.add(modelRoot, addition);
const sky = new THREE.Mesh(new THREE.SphereGeometry(8000, 8, 6));
sky.position.set(3, 11, 4);
scene.add(sky);
const originalSky = sky.position.clone();
const pmrem = {
  fromCubemap() {
    conversions++;
    const target = new THREE.WebGLRenderTarget(768, 1024, { type: THREE.HalfFloatType });
    target.wasDisposed = false;
    target.dispose = () => {
      target.wasDisposed = true;
    };
    targets.push(target);
    return target;
  },
  dispose() {
    assert.fail("Do not dispose the shared generator during a mood change");
  },
};
Object.assign(world, {
  scene,
  modelRoot,
  sky,
  skyUniforms: { horizon: { value: new THREE.Color(0xaabbcc) } },
  quality: { compact: false, hdr: true },
  waterUniforms: [{ reflectionPass: { value: 0 } }],
  camera: new THREE.PerspectiveCamera(40, 1, 2, 11000),
  canvas: { dataset: {} },
  mood: "morning",
  modelMaterials: new Set([material, addedMaterial]),
  pmremGenerator: pmrem,
  renderer: {
    shadowMap: { needsUpdate: true },
    readRenderTargetPixels(target, x, y, w, h, buffer) {
      assert(x >= 0 && x < target.width && y >= 0 && y < target.height);
      for (let index = 0; index < buffer.length; index += 4)
        buffer.set([0x3266, 0x34cd, 0x3666, 0x3c00], index);
      // The regression was away from face centres, in the filtered atlas.
      if (invalid && buffer.length > 4) buffer[buffer.length - 8] = 0x7e00;
    },
  },
});
const restored = () => {
  assert.equal(
    world.waterUniforms[0].reflectionPass.value,
    0,
    "Water capture mode must restore even when capture throws",
  );
  assert.equal(modelRoot.visible, true);
  assert.equal(addition.visible, true);
  assert.equal(scene.background, originalBackground);
  assert(sky.position.equals(originalSky));
  assert.equal(world.renderer.shadowMap.needsUpdate, true);
};
world.captureGlassEnvironment();
restored();
const first = world.glassEnvironment;
assert.equal(material.envMap, first.texture);
world.mood = "afternoon";
world.captureGlassEnvironment();
restored();
const second = world.glassEnvironment;
assert.notEqual(first, second);
assert(first.wasDisposed);
assert.equal(world.pmremGenerator, pmrem, "Repeated captures must reuse the generator");
invalid = true;
world.mood = "night";
world.captureGlassEnvironment();
restored();
assert.equal(
  world.glassEnvironment,
  second,
  "Invalid radiance must not replace the last valid probe",
);
assert.equal(material.envMap, second.texture);
assert.equal(
  world.canvas.dataset.glassAtlasInvalid,
  "1",
  "A single invalid texel outside the old sample points must be detected",
);
assert(!second.wasDisposed);
assert(targets.at(-1).wasDisposed);
world.glassEnvironment = null;
world.captureGlassEnvironment();
assert.equal(
  material.envMap,
  scene.environment,
  "An initial failure must use the prepared sky map",
);
invalid = false;
failCapture = true;
world.captureGlassEnvironment();
restored();
assert.match(world.canvas.dataset.glassProbeError, /Simulated capture failure/);
const count = captures;
world.quality.compact = true;
world.captureGlassEnvironment();
assert.equal(captures, count);
assert.equal(conversions, 4);
const ocean = fs.readFileSync(path.join(root, "assets/ray/environment/ocean.js"), "utf8");
assert.match(ocean, /pow\(clamp\(1\.-dot\(eye,normal\),0\.,1\.\),4\.\)/);
assert.match(ocean, /reflectionPass<\.5 && reflectionCoord\.w>\.0001/);
console.log(
  "Pass: sky capture range, shared generator, full-atlas invalid-texel rejection, camera-independent ocean capture, fallback and state restoration.",
);
