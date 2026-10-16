import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (name) => fs.readFileSync(path.join(root, name));
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const order = JSON.parse(read("tools/ray/script-order.json")).map((url) => url.split("?")[0]);
const extra = [
  "assets/ray/models/site.glb",
  "assets/ray/textures/shore-distance.png",
  "assets/ray/ui/experience.css",
  "assets/ray/ui/miami-map.css",
];
const assets = [...new Set([...order, ...extra])].map((name) => {
  const bytes = read(name);
  const sha256 = hash(bytes);
  return { url: `${name}?v=${sha256}`, bytes: bytes.length, sha256 };
});
const bootHash = hash(read("assets/ray/core/boot.js"));
const workerHash = hash(read("ray-sw.js"));
const version = `scene-${hash(JSON.stringify({ assets, bootHash, workerHash })).slice(0, 16)}`;
const manifest = {
  schema: 2,
  version,
  scripts: order.map((name) => assets.find((asset) => asset.url.split("?")[0] === name).url),
  assets,
};
fs.writeFileSync(
  path.join(root, "assets/ray/scene-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);

// Each published HTML points at the current bootstrap, even under the previous worker.
const htmlPath = path.join(root, "ray-experience.html");
let html = fs.readFileSync(htmlPath, "utf8");
for (const name of ["assets/ray/core/boot.js", ...extra.filter((name) => name.endsWith(".css"))]) {
  const digest = name.endsWith("boot.js")
    ? bootHash
    : assets.find((asset) => asset.url.split("?")[0] === name).sha256;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  html = html.replaceAll(new RegExp(`${escaped}\\?[^"\\s]+`, "g"), `${name}?v=${digest}`);
}
fs.writeFileSync(htmlPath, html);
console.log(
  `${version}: ${assets.length} content-versioned resources, ${Math.round(assets.reduce((total, asset) => total + asset.bytes, 0) / 1000000)} MB before HTTP compression.`,
);
