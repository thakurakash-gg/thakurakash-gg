# Kazeyami opening — 4.0.0

Reference examined on 2026-10-18: https://string-tune.fiddle.digital/

The requested direction is its diagonal katana, dark editorial opening, oversized
name, translucent compact navigation, blade reveal and scroll-led progression.
The public page identifies StringTune, with Nuxt-generated JavaScript and CSS.
Its information control opens additional navigation. The katana draws from its
scabbard and rotates as the visitor scrolls. These observations informed this
implementation; the private backend is neither exposed nor part of this build.
No reference code, model, textures, illustrations, tracking or character artwork
have been incorporated.

## Implementation

- `index.html`: new opening and studio introduction; existing project routes,
  process, FAQ, enquiry form and footer retained.
- `assets/home/katana-scene.js`: original curved blade and lacquered scabbard,
  interlaced ivory grip, textured materials, gold fittings and studio environment.
  Uses the existing local Three.js dependency; no additional runtime package.
- `assets/home/branches.svg`: original seeded branch illustration.
- `assets/home/katana-poster.svg`: original static loading/WebGL fallback.
- `assets/home/katana.css`: scoped homepage presentation and responsive layouts.
- `assets/home/home.js`: scroll progress, chrome and visibility-driven film playback.
- `assets/site.js`: skip its previous eager hero-film handler on this homepage;
  other pages keep their existing behavior.

Scroll reveals the blade and moves the scene into a second composition. A button
and mouse drag provide manual drawing; pointer movement changes the viewing angle.
Pause freezes automatic model motion while manual drawing remains available.
The information button opens the existing keyboard-accessible navigation drawer.
Escape closes it and returns focus. All navigation leads to real studio content.

## Preserved section

`#services`, including “Find your direction”, is retained character for character.
Its CSS rules and video interactions remain in the original shared files.
SHA-256 of the section source:
`84c95f49695f7056196cfb6a153f7aca013ee89a79c3cfb619c08098506bfb3e`

The RAY experience, models, cache manifest and rendering code are unchanged.

## Rendering and loading

The model and materials are constructed locally; there is no GLB or texture fetch.
The five new visual/runtime assets total approximately 86 KB uncompressed and
20 KB gzip, in addition to the already-used Three.js library. Pixel ratio is capped
at 1.8, or 1.35 on reported low-memory devices. Frames are requested only for
interaction, scroll, resize or an unsettled blade transition. Offscreen/hidden
rendering is stopped. Reduced-motion preferences suppress scroll choreography.
If WebGL is unavailable, the static poster remains and the opening has one screen
of height. The film loads on visibility and respects reduced motion/data saving.

Versioned stylesheet and script URLs avoid stale homepage code. No new service
worker, analytics, backend, forms service or external runtime dependency is added.

## Verification

- JavaScript syntax and local asset/link checks.
- Exact preserved-section hash and unchanged shared stylesheet.
- Browser rendering without console errors at the native desktop viewport.
- Responsive 390 × 844 layout without horizontal overflow.
- Manual draw/sheathe, scroll reveal, pause/resume and navigation drawer.
- Escape/focus return, work/studio/contact anchors and existing contact fields.
- Contact contrast corrected after phone screenshot review.

Responsive browser testing does not establish frame rate on physical Android or
iOS hardware. No physical-device FPS claim is made.
