import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const order = JSON.parse(fs.readFileSync(path.join(root, "tools/ray/script-order.json"), "utf8"));
const extra = [
  "assets/ray/models/site.glb?v=render-25",
  "assets/ray/textures/shore-distance.png?v=roadside-12",
  "assets/ray/ui/experience.css?v=render-25",
  "assets/ray/ui/miami-map.css?v=render-25",
];
const assets = [...order, ...extra].map((url) => {
  const bytes = fs.readFileSync(path.join(root, url.split("?")[0]));
  return {
    url,
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  };
});
fs.writeFileSync(
  path.join(root, "assets/ray/scene-manifest.json"),
  JSON.stringify({ version: "render-25", scripts: order, assets }, null, 2),
);
console.log(
  `Scene manifest: ${assets.length} resources, ${Math.round(assets.reduce((total, asset) => total + asset.bytes, 0) / 1000000)} MB before HTTP compression.`,
);
