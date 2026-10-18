# Website 4.3.0

Reference review: StringTune on 18 October 2026 shows roughly 32 CSS-pixel opaque cells quantizing the sculpture under the pointer, with a short resolving wake. The old decorative square particles have been removed. The replacement uses a small nearest-filtered mask and a single compositor pass over the original rendered katana. It runs only while pointer energy is present, supports transparent edges and preserves the original tone mapping. Coarse pointers and reduced motion bypass the effect. No reference source or artwork is copied.

The studio heading now uses a small introductory line and a larger italic serif question, without crowded quotation marks. Its text remains selectable and responsive.

Light mode previously inherited hard-coded dark section surfaces. The shared theme now gives the marketing pages warm light surfaces, dark text and logo lettering, matching form labels and a brighter home film. Cinematic portfolio preview rows and the native RAY prototype are retained.

The menu background is an original procedural scene inspired by the ThreeUI Temple Night reference: curved temple roofs, a torii, stone approach, lanterns, trees, rain and leaves. The existing links, focus management, Escape handling and right-side slide remain. No reference renderer code or assets are included. Scene creation is deferred until the first menu open; the renderer is capped to DPR 1.25 and about 30 fps, stops when the menu closes or the page is hidden, and renders a still for reduced motion. Repeated forest and leaf geometry is instanced. The home film and katana renderer pause while the menu is open.

Version runtime asset queries with `node tools/site/version-marketing.mjs` after changing files. Each key includes the release plus a content hash, so unchanged query caches cannot serve earlier code for a final release.

Validation: preserved direction-section hash, local asset paths, contact identity, JavaScript syntax, real WebGL pixelation, phone heading/menu layout and both theme states. Android hardware performance is not measured in this change.
