import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateReleases, renderChangelog } from "./releases.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/ray/scene-manifest.json")));
assert.equal(manifest.schema, 2, "Regenerate the content-versioned scene manifest");
const history = JSON.parse(fs.readFileSync(path.join(root, "docs/ray/releases.json")));
const release = validateReleases(history, manifest.version);
assert.equal(manifest.release.version, release.version, "Release metadata is stale");
assert.equal(
  fs.readFileSync(path.join(root, "CHANGELOG-RAY.md"), "utf8").replace(/\r\n/g, "\n"),
  renderChangelog(history),
  "Regenerate the changelog with the manifest tool",
);
const html = fs.readFileSync(path.join(root, "ray-experience.html"), "utf8");
const bootHash = crypto
  .createHash("sha256")
  .update(fs.readFileSync(path.join(root, "assets/ray/core/boot.js")))
  .digest("hex");
assert(
  html.includes(`assets/ray/core/boot.js?v=${bootHash}`),
  "The HTML bootstrap version is stale",
);
for (const asset of manifest.assets) {
  const bytes = fs.readFileSync(path.join(root, asset.url.split("?")[0]));
  assert.equal(bytes.length, asset.bytes, `Stale manifest: ${asset.url}`);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    asset.sha256,
    `Stale manifest: ${asset.url}`,
  );
  assert.equal(new URL(asset.url, "https://ray.test/").searchParams.get("v"), asset.sha256);
}
execFileSync(process.execPath, [path.join(root, "tools/ray/check-cache.mjs")], {
  stdio: "inherit",
});
execFileSync(process.execPath, [path.join(root, "tools/ray/check-life.mjs")], { stdio: "inherit" });
execFileSync(process.execPath, [path.join(root, "tools/ray/check-reflections.mjs")], {
  stdio: "inherit",
});
execFileSync(process.execPath, [path.join(root, "tools/ray/check-transitions.mjs")], {
  stdio: "inherit",
});
execFileSync(process.execPath, [path.join(root, "tools/ray/check-planting.mjs")], {
  stdio: "inherit",
});
for (const folder of ["core", "environment", "architecture", "ui"])
  for (const name of fs.readdirSync(path.join(root, "assets/ray", folder))) {
    if (name.endsWith(".js"))
      execFileSync(process.execPath, ["--check", path.join(root, "assets/ray", folder, name)]);
  }
execFileSync(process.execPath, ["--check", path.join(root, "ray-sw.js")]);
const code = fs.readFileSync(path.join(root, "assets/ray/core/quality.js"), "utf8");
const context = {
  window: { devicePixelRatio: 3 },
  navigator: { deviceMemory: 8, hardwareConcurrency: 8 },
  innerWidth: 412,
  innerHeight: 850,
  devicePixelRatio: 3,
};
vm.createContext(context);
vm.runInContext(code, context);
const quality = context.window.RayQuality();
assert.equal(quality.pixelRatio, 2);
let ratio = 2;
const world = {
  quality,
  canvas: { dataset: {}, clientWidth: 412, clientHeight: 850 },
  mirrorTarget: { width: 768, height: 1200 },
  frameMs: 45,
  renderCostMs: 30,
  renderer: { getPixelRatio: () => ratio, setPixelRatio: (value) => (ratio = value), setSize() {} },
};
for (let frame = 0; frame < 5000; frame++) context.window.RayAdaptQuality.call(world, frame * 20);
assert(ratio >= 1, "Resolution must not fall below CSS pixel density");
assert(quality.reflectionScale >= quality.reflectionMinimum - 0.001);
const data = JSON.parse(
  fs
    .readFileSync(path.join(root, "assets/ray/data/neighborhood.js"), "utf8")
    .split("=", 2)[1]
    .trim()
    .replace(/;$/, ""),
);
const area = (rings) =>
  rings.reduce((sum, ring, index) => {
    let a = 0;
    for (let i = 0; i < ring.length; i++) {
      const next = ring[(i + 1) % ring.length];
      a += ring[i][0] * next[1] - next[0] * ring[i][1];
    }
    return sum + (index ? -1 : 1) * Math.abs(a / 2);
  }, 0);
assert(
  data.roadSurfaces.reduce((sum, rings) => sum + area(rings), 0) > 650000,
  "Neighborhood road coverage regressed",
);
assert(data.pavingSurfaces.length > 100, "Neighborhood sidewalks are missing");
const glb = fs.readFileSync(path.join(root, "assets/ray/models/site.glb"));
const document = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
assert(
  document.extensionsUsed.includes("EXT_mesh_gpu_instancing"),
  "Repeated floor instances missing",
);
console.log(
  "Pass: source syntax, scene resources, adaptive resolution floor, road coverage, and instanced floor export.",
);
