# Kazeyami opening — 4.1.0

The original reference is https://string-tune.fiddle.digital/ (examined 2026-10-18).
Kazeyami uses original procedural geometry and artwork, with the existing local
Three.js runtime. No reference assets, tracking or backend code were copied.

## Current behavior

- Original top-right hamburger and right-side sliding menu restored. Existing
  keyboard focus handling and Escape behavior remain in `assets/site.js`.
- Original light/dark theme switch visible on desktop and mobile, with the
  existing saved preference. No home-page Pause motion button.
- Katana scroll reveal, pointer parallax, manual button and mouse dragging retained.
  Reduced-motion preferences remain automatic.
- Original floating Kazeyami shapes are reused behind the collaboration section
  only. Its copy and seven-field enquiry form remain unchanged. No scatter/color
  controls or old studio-section copy are added to that background.

## Blade and extraction repair

`assets/home/katana-geometry.js` builds a single welded blade with a tapered
kissaki and integrated bevels. It replaces the previous overlapping face and tube
meshes. The blade has 746 vertices, 1,488 triangles and three material batches.
The scabbard has 6,466 vertices, 12,928 triangles and two material batches. Its
mouth is an annulus connected to inner cavity walls, rather than a solid cap.

Blade and cavity share a circular spine with radius 1 / 0.044. Extraction rotates
and translates the blade about the same center; the scabbard stays fixed. Each
concealed blade section therefore stays on the cavity centerline throughout the
motion. At full travel the tip clears the mouth. The camera composition zooms
out during extraction to show the blade on narrow desktop layouts; phone framing
focuses on the blade and opening.

`tools/site/check-katana.cjs` verifies closed welded topology, finite vertices,
nondegenerate triangles, material batching and exact intermediate extraction
alignment. `tools/site/check-home.mjs` verifies local assets, versioned runtime,
the restored controls, contact background and preserved direction-section hash.

## Background and performance

`assets/home/contact-background.js` reuses the original logo outline and beveled
extrusion. Twenty-seven marks share one geometry and three instanced material
batches. Animation is limited to 30 FPS, pixel ratio to 1.25; it stops offscreen,
in hidden tabs and for reduced-motion preferences. Pointer events pass through
to the form. Dark scrims preserve text contrast. No background interactions or
new external dependencies are introduced.

The katana continues to render on demand, with capped pixel ratio and a static
WebGL fallback. The studio film still loads on visibility. Homepage runtime URLs
are versioned 4.1.0. RAY rendering and cache files are unchanged; its branch return link and contact address are updated.

## Preserved content

The `#services` design, films and other rows remain unchanged. At the user’s
request, its first row now names NEXIV as the architecture branch and RAY as its
platform, with a link to nexiv.html. Approved section source SHA-256:
`0d1c8e332b3798bcdada7545147c5814d782a895b7c4680b8d1f9bc627647a70`

Browser checks cover native desktop and 390 x 844 phone layouts, drawing and
sheathing, the original menu, theme switching, contact background and form access.
They do not establish frame rates on physical Android or iOS hardware.

NEXIV is the architecture branch; RAY remains its interactive platform. The old
ray.html address redirects to nexiv.html. All public contact addresses and enquiry
drafts use sales@kazeyami.com. Shared scripts use version 4.1.0 for cache refresh.
