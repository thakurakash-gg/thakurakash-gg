import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const pages = [
  "index.html",
  "nexiv.html",
  "3d.html",
  "design.html",
  "products.html",
];
const version = fs
  .readFileSync(path.join(root, "index.html"), "utf8")
  .match(/data-studio-version="([^"\s]+)"/)[1];
const escaped = version.replaceAll(".", "\\.");
const query = new RegExp(
  `(assets/[^"?]+\\.(?:css|js))\\?v=${escaped}(?:\\.[a-f0-9]{8})?`,
  "g",
);
for (const page of pages) {
  const filename = path.join(root, page);
  const source = fs.readFileSync(filename, "utf8");
  fs.writeFileSync(
    filename,
    source.replace(query, (_, asset) => {
      const hash = createHash("sha256")
        .update(fs.readFileSync(path.join(root, asset)))
        .digest("hex")
        .slice(0, 8);
      return `${asset}?v=${version}.${hash}`;
    }),
  );
}
console.log(`Marketing assets refreshed for ${version}.`);
