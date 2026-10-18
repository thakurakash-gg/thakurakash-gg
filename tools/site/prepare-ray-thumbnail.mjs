/* Local still preparation only. Uses the real platform markup and controls. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
let html = fs.readFileSync(path.join(root, "ray-experience.html"), "utf8");
html = html.replace(
  /<script src="assets\/ray\/core\/boot\.js[^\"]*"><\/script>/,
  "",
);
html = html.replace('data-loading="true"', 'data-loading="false"');
html = html.replace(
  /<canvas[\s\S]*?<\/canvas>/,
  '<img id="scene" src="/__ray-raw.webp" alt="RAY full-detail scene, rendered in Blender at dawn">',
);
html = html.replace(
  "</head>",
  `<base href="/"><style>
  #scene{width:100%;height:100%;object-fit:cover;opacity:1!important}
  .navigation,#load-state,#terrain-status,#startup-map-credit{display:none!important}
  .scene-shade{opacity:.2}
</style></head>`,
);
html = html.replace(/(id="view-count"[^>]*>)\d+/, "$1152");
fs.writeFileSync(path.join(root, "__ray-still.html"), html);
console.log(
  "Prepared __ray-still.html for a local 1600 × 900 screenshot; never publish this temporary page.",
);
