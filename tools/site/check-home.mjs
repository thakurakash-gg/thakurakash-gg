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
// Decorative vector arrows may change without altering the approved branch copy.
const directionCopy = section.replace(/<svg class="ui-arrow"[\s\S]*?<\/svg>/g, "↗");
assert.equal(
  createHash("sha256").update(directionCopy.replace(/\r\n/g, "\n")).digest("hex"),
  "bf9601cceb4712b89cfb24ca60215fe50dcb54653221b845d3a8a7c5b102dd36",
  "Four cinematic branch rows must retain the approved launch taxonomy",
);
assert(html.includes('data-studio-version="4.14.1"'));
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
  "assets/home/home.js",
  "assets/home/logo-background.js",
  "assets/home/menu-background.js",
  "assets/home/katana.css",
  "assets/home/contact-background.js",
]) {
  assert(html.includes(`${asset}?v=4.14.1`), `Unversioned runtime: ${asset}`);
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

for (const id of ["studio", "process", "faq", "contact", "opening-work-video"])
  assert(html.includes(`id="${id}"`), `Missing home section/control: ${id}`);
assert(
  !html.includes('id="katana-stage"'),
  "The sword canvas has been removed",
);
assert(!html.includes('id="draw-blade"'), "The draw control has been removed");
assert(
  !html.includes('class="reveal-copy"'),
  "Unused sword reveal copy removed",
);
assert(
  !/<script[^>]+src="assets\/(?:three\.min\.js|home\/(?:katana-[^"?]+|pixel-cursor\.js))/.test(
    html,
  ),
  "The home introduction must not load THREE or sword runtime scripts",
);
assert(
  html.includes('class="opening-prompt"'),
  "The scroll prompt remains plain HTML",
);
assert(
  html.includes('aria-label="Kazeyami studio introduction"'),
  "The introduction has an accurate accessible label",
);
assert(!html.includes('class="branch-art"'), "Tree backdrop removed");
assert(!html.includes('class="work-peek"'), "Hero studio label removed");
assert(!html.includes('class="scroll-prompt"'), "Hero scroll label removed");
const nexiv = await readFile(path.join(root, "nexiv.html"), "utf8");
assert(nexiv.includes("ray-platform-day-1440.webp?v=4.14.1"));
