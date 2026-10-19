import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { validateReleases, renderChangelog } from "./releases.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (name) => {
  const file = path.join(root, name);
  const bytes = fs.readFileSync(file);
  if (!/\.(js|css|json)$/.test(name)) return bytes;
  // GitHub Pages serves Git's LF text; normalize before hashing on Windows too.
  const normalized = Buffer.from(
    bytes
      .toString("utf8")
      .replace(/\r\n/g, "\n")
      .replace(/^\uFEFF/, ""),
  );
  if (!bytes.equals(normalized)) fs.writeFileSync(file, normalized);
  return normalized;
};
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const order = JSON.parse(read("tools/ray/script-order.json")).map((url) => url.split("?")[0]);
const extra = [
  "assets/ray/models/site.glb",
  "assets/ray/textures/shore-distance.png",
  "assets/ray/ui/experience.css",
  "assets/ray/ui/miami-map.css",
  "assets/ray/audio/coast-gulls.mp3",
  "assets/ray/audio/coast-shore.mp3",
  "assets/ray/audio/coast-wind.mp3",
];
const assets = [...new Set([...order, ...extra])].map((name) => {
  const bytes = read(name);
  const sha256 = hash(bytes);
  return {
    url: `${name}?v=${sha256}`,
    bytes: bytes.length,
    sha256,
    ...(name.endsWith(".mp3") ? { lazy: true } : {}),
  };
});
const bootHash = hash(read("assets/ray/core/boot.js"));
const workerHash = hash(read("ray-sw.js"));
const version = `scene-${hash(JSON.stringify({ assets, bootHash, workerHash })).slice(0, 16)}`;
if (process.argv.includes("--scene-id")) {
  console.log(version);
  process.exit(0);
}
const history = JSON.parse(read("docs/ray/releases.json"));
const release = validateReleases(history, version);
const manifest = {
  schema: 2,
  version,
  release: { version: release.version, date: release.date, changelog: "CHANGELOG-RAY.md" },
  scripts: order.map((name) => assets.find((asset) => asset.url.split("?")[0] === name).url),
  assets,
};
fs.writeFileSync(path.join(root, "CHANGELOG-RAY.md"), renderChangelog(history));
fs.writeFileSync(
  path.join(root, "assets/ray/scene-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);

// Each published HTML points at the current bootstrap, even under the previous worker.
const htmlPath = path.join(root, "ray-experience.html");
let html = fs.readFileSync(htmlPath, "utf8");
const versions = new Map(assets.map((asset) => [asset.url.split("?")[0], asset.sha256]));
versions.set("assets/ray/core/boot.js", bootHash);
html = html.replace(/(src|href)="([^"]+)"/g, (attribute, kind, url) => {
  const name = url.split("?")[0];
  return versions.has(name) ? `${kind}="${name}?v=${versions.get(name)}"` : attribute;
});
fs.writeFileSync(htmlPath, html);
console.log(
  `${version}: ${assets.length} content-versioned resources, ${Math.round(assets.reduce((total, asset) => total + asset.bytes, 0) / 1000000)} MB before HTTP compression.`,
);
