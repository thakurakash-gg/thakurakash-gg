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
  "0d1c8e332b3798bcdada7545147c5814d782a895b7c4680b8d1f9bc627647a70",
  "Direction layout and approved NEXIV identity must remain unchanged",
);
assert(html.includes('data-studio-version="4.8.1"'));
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
  "assets/home/katana-interaction.js",
  "assets/home/katana-intro.js",
  "assets/home/katana-flight.js",
  "assets/home/katana-finish.js",
  "assets/home/katana-wordmark.js",
  "assets/home/logo-background.js",
  "assets/home/menu-background.js",
  "assets/home/pixel-cursor.js",
  "assets/home/katana.css",
  "assets/home/katana-geometry.js",
  "assets/home/contact-background.js",
]) {
  assert(html.includes(`${asset}?v=4.8.1`), `Unversioned runtime: ${asset}`);
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

for (const id of [
  "studio",
  "process",
  "faq",
  "contact",
  "opening-work-video",
  "draw-blade",
])
  assert(html.includes(`id="${id}"`), `Missing home section/control: ${id}`);
assert(!html.includes('class="branch-art"'), "Tree backdrop removed");
assert(!html.includes('class="work-peek"'), "Hero studio label removed");
assert(!html.includes('class="scroll-prompt"'), "Hero scroll label removed");
const nexiv = await readFile(path.join(root, "nexiv.html"), "utf8");
assert(nexiv.includes("ray-platform-dawn.webp?v=4.2.0"));
