/* Studio release keys stay independent of the RAY scene cache. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const directory = path.join(root, "assets/studio");
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const assets = fs
  .readdirSync(directory)
  .filter((name) => name !== "manifest.json")
  .map((name) => {
    const filename = path.join(directory, name);
    let bytes = fs.readFileSync(filename);
    if (/\.(css|js|txt)$/.test(name)) {
      bytes = Buffer.from(bytes.toString("utf8").replace(/\r\n/g, "\n"));
      if (!process.argv.includes("--check")) fs.writeFileSync(filename, bytes);
    }
    return { url: "assets/studio/" + name, bytes: bytes.length, sha256: hash(bytes) };
  });
const source = JSON.stringify({ version: "1.0.0", date: "2026-10-17", assets }, null, 2) + "\n";
const check = process.argv.includes("--check");
if (check) {
  if (fs.readFileSync(path.join(directory, "manifest.json"), "utf8") !== source)
    throw Error("Studio manifest is stale");
} else fs.writeFileSync(path.join(directory, "manifest.json"), source);
for (const name of [
  "index.html",
  "about.html",
  "portfolio.html",
  "services.html",
  "team.html",
  "connect.html",
  "nexiv.html",
  "3d.html",
  "design.html",
  "products.html",
  "ray.html",
]) {
  const filename = path.join(root, name),
    before = fs.readFileSync(filename, "utf8");
  let after = before.replace(/<html[^>]*>/, '<html lang="en" data-studio-version="1.0.0">');
  for (const asset of assets) {
    if (!/\.(css|js)$/.test(asset.url)) continue;
    const pattern = new RegExp(
      '((?:src|href)=")' + asset.url.replaceAll(".", "\\.") + '(?:\\?[^"]*)?"',
      "g",
    );
    after = after.replace(pattern, "$1" + asset.url + "?v=" + asset.sha256.slice(0, 16) + '"');
  }
  if (check) {
    if (after !== before) throw Error("Stale page version: " + name);
  } else fs.writeFileSync(filename, after);
}
console.log("Studio 1.0.0: " + assets.length + " fingerprinted assets; 11 page links verified.");
