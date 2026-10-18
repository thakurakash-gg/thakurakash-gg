import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("../../", import.meta.url));
const html = await readFile(path.join(root, "index.html"), "utf8");
const start = html.indexOf('<section id="services"');
assert(start >= 0, "Retained direction section must exist");
const section = html.slice(start, html.indexOf("</section>", start) + 10);
assert.equal(
  createHash("sha256").update(section).digest("hex"),
  "84c95f49695f7056196cfb6a153f7aca013ee89a79c3cfb619c08098506bfb3e",
  "Find your direction must remain unchanged",
);
assert(html.includes('data-studio-version="4.0.1"'));
for (const asset of [...html.matchAll(/(?:src|href|poster)="([^"#]+)"/g)].map(
  (m) => m[1],
)) {
  if (/^(https?:|mailto:|data:)/.test(asset)) continue;
  const name = asset.split(/[?#]/)[0];
  if (name)
    assert(
      (await stat(path.join(root, name))).isFile(),
      `Missing asset: ${name}`,
    );
}
for (const asset of [
  "assets/site.js",
  "assets/home/katana-scene.js",
  "assets/home/home.js",
  "assets/home/katana.css",
  "assets/home/katana-geometry.js",
  "assets/home/contact-background.js",
]) {
  assert(html.includes(`${asset}?v=4.0.1`), `Unversioned runtime: ${asset}`);
}
console.log(
  "Homepage: preserved section, local assets, routes and versioned runtime verified.",
);

assert(!html.includes('id="motion-toggle"'), "Pause motion control removed");
assert(
  !html.includes('class="quick-nav"'),
  "Original header controls restored",
);
assert(
  html.includes('id="contact-logo-background"'),
  "Contact background present",
);
