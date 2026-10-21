import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const root = new URL("../../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const pages = [
  "index.html",
  "nexiv.html",
  "studio.html",
  "products.html",
  "services.html",
  "work.html",
  "events.html",
  "ray-experience.html",
];
for (const name of [...pages, "assets/site.js", "assets/portfolio.js"]) {
  const source = await read(name);
  assert(
    !/hr(?:@|%40)kazeyami\.com/i.test(source),
    `${name}: old contact address`,
  );
  assert(
    source.includes("sales@kazeyami.com"),
    `${name}: sales address required`,
  );
  for (const [, email] of source.matchAll(/mailto:([^?'"\s]+)/g))
    assert.equal(email, "sales@kazeyami.com", `${name}: mailto destination`);
}
for (const name of pages.filter((name) => name !== "ray-experience.html")) {
  const source = await read(name);
  assert(source.includes('href="nexiv.html"'), `${name}: NEXIV navigation`);
  assert(
    source.includes("assets/site.js?v=4.14.0"),
    `${name}: refreshed enquiry script`,
  );
}
const nexiv = await read("nexiv.html");
assert(nexiv.includes("<h1>NEXIV</h1>"));
assert(nexiv.includes("RAY is our interactive platform within NEXIV"));
assert(nexiv.includes('href="ray-experience.html?v=26.7.1"'));
const legacy = await read("ray.html");
assert(
  legacy.includes(
    "location.replace('nexiv.html'+location.search+location.hash)",
  ),
);
const prototype = await read("ray-experience.html");
assert(prototype.includes("<b>RAY</b><small>BY NEXIV</small>"));
assert(prototype.includes('aria-label="Return to NEXIV"'));
console.log(
  "Sales contacts, refreshed enquiry scripts, NEXIV branch and RAY platform identity verified.",
);
