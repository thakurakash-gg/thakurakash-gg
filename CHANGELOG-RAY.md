# RAY changelog

Product versions describe published milestones; scene/cache IDs identify the exact runtime assets. Version 26.0.0 introduces this maintained log and corresponds to the existing life-26 preview. Historical coverage begins with render-25.

Future releases use MAJOR.MINOR.PATCH: breaking changes, enhancements, then fixes. Runtime changes require a new entry; documentation-only changes may keep the same scene/cache ID.

## [26.4.1](https://github.com/thakurakash-gg/thakurakash-gg/tree/ray-v26.4.1) — 2026-10-17

Stable frames during adaptive quality and mobile resizing

- Scene/cache ID: `scene-147c0d23c3f0a480`
- Preview label: `26.4.1`

### Fixed

- Adaptive resolution changes run before rendering, so resizing the drawing buffer cannot erase the completed visible frame.
- Browser viewport resize events queue their buffer changes until the next render, including phone browser-bar and orientation changes.
- Resolution changes use one drawing-buffer update, and reflection capture is refreshed in the same frame.

### Changed

- Quality recovery requires 12 seconds of sustained headroom and a 30-second cooldown after downgrading; compact devices retain their initial reflection budget.

### Validation

- Regression executes the actual render loop with canvas-clear tracking for high and compact device profiles. The previous ordering reproduces a blank final frame.
- Viewport resize events preserve the visible buffer until the render transaction; recovery cooldown and sustained quality restoration checks.
- Full scene, tree placement, shoreline, cache, glass-reflection and transition regression checks.

### Known limits

- Browser portrait verification is not a physical Android hardware test.

## [26.4.0](https://github.com/thakurakash-gg/thakurakash-gg/tree/ray-v26.4.0) — 2026-10-17

Clear roads, repaired coastal ground and a planted dining courtyard

- Scene/cache ID: `scene-beb1885afdbd4c6b`
- Preview label: `26.4.0`

### Fixed

- Moved 1,028 context trees onto verified green ground using both polygon outlines and the rendered graded road and sidewalk meshes. All 5,693 tree bases keep clearance; shared foliage instancing is preserved.
- Repaired self-intersecting coastal ground contours that made triangulation leave a missing wedge beside the inlet.

### Added

- A lightweight dining garden between the towers: six dining tables, 36 chairs, seven planted beds, four palms and warm lanterns, using existing materials and shared instance geometry.

### Validation

- Independent geometry checks cover every tree against both rendered road and paving meshes.
- Rendered ground triangle areas are checked against the coastal outlines.
- Full cache, reflection, lighting transition and scene regression checks; browser inspection.
- Browser asset budget: 16,930 added triangles, 583 instance placements, nine added batches, zero new materials and zero added real-time lights.

### Known limits

- Natural foliage can overhang the edge of green planting areas; trunks are kept at least 3.5 m from road surfaces and 1.65 m from paving.
- Physical low-end-device testing remains pending.

Commits: [ed076af](https://github.com/thakurakash-gg/thakurakash-gg/commit/ed076af), [5eb7358](https://github.com/thakurakash-gg/thakurakash-gg/commit/5eb7358).

## [26.3.2](https://github.com/thakurakash-gg/thakurakash-gg/tree/ray-v26.3.2) — 2026-10-16

Smooth warm plaster and rounded inlet shore

- Scene/cache ID: `scene-e39cd3990cc78fe8`
- Preview label: `26.3.2`

### Changed

- Building walls use a continuous warm-white plaster finish with subtle grain and no panel or tile joints.
- The inlet peninsula corners use smooth curves in both the ground surface and shore walls; the ocean distance field is rebaked to the revised edge.

### Validation

- Coast bake checks validity, keeps maximum boundary displacement to 1.046 m and limits changed land area to 10.163 square metres.
- Existing full scene, cache, glass-transition and reflection regression checks.

### Known limits

- Physical low-end-device testing remains pending.

## [26.3.1](https://github.com/thakurakash-gg/thakurakash-gg/tree/ray-v26.3.1) — 2026-10-16

Continuous glass lighting and bridge-only highway guidance

- Scene/cache ID: `scene-b6eebb0483dee4b9`
- Preview label: `26.3.1`

### Fixed

- Glazing keeps one HDR texture binding and blends the prepared reflection atlases continuously with the lighting, including interrupted switches.
- The glowing line follows only the Northeast 123rd Street / Broad Causeway / 96th Street corridor, including one-way bridge sections and the full mapped road extent.
- The temporary Blender authoring control and page have been removed; the Blender file is delivered separately.

### Validation

- Automated persistent-binding, interrupted-fade, normalized-weight, settled-pass and bridge-only geometry regressions.
- Full scene/cache integrity and existing reflection regressions.

### Known limits

- Lighting naturally changes reflected colours; the abrupt end-of-transition map swap has been removed.
- Physical low-end-device testing remains pending.

## [26.3.0](https://github.com/thakurakash-gg/thakurakash-gg/tree/ray-v26.3.0) — 2026-10-16

Night road guidance and illuminated vessels

- Scene/cache ID: `scene-d6bcebe4d9091132`
- Preview label: `26.3.0`

### Added

- Night-only warm highway guidance lines with broad soft halos, plus dimmer local-street lighting in one merged ribbon.
- Shared yacht deck strips, port/starboard navigation lights, mast lights and warm cabin illumination.

### Validation

- Browser day/night appearance and reflection-cache reuse checked.
- Full scene/cache and invalid-reflection regression checks.

### Known limits

- Stylized road guidance is a presentation layer; it is not a live navigation route.
- Physical Android and low-end hardware testing remains pending.

## [26.2.0](https://github.com/thakurakash-gg/thakurakash-gg/tree/ray-v26.2.0) — 2026-10-16

Denser instanced trees and prepared lighting reflections

- Scene/cache ID: `scene-a283a720f99a9c3e`
- Preview label: `26.2.0`

### Added

- 1,400 additional open-land trees share the existing trunk, crown, palm and contact-shadow instance batches.

### Changed

- All four glass reflection environments are prepared under the loading bar and reused during daytime switching.
- Additional background trees use two shared leaf clusters to limit added geometry and alpha overdraw.

### Validation

- Placement bake excludes roads, sidewalks, buildings, project grounds, pools and driveways; minimum tree spacing is 8 m.
- Automated repeated lighting selection must not create more reflection captures after preparation.

### Known limits

- More vegetation adds vertex and fill work despite sharing draw calls; physical low-end device testing remains pending.

## [26.1.2](https://github.com/thakurakash-gg/thakurakash-gg/tree/ray-v26.1.2) — 2026-10-16

Stable glazing through repeated lighting switches

- Scene/cache ID: `scene-353870cd70740200`
- Preview label: `26.1.2`

### Fixed

- Ocean Fresnel uses a non-negative, bounded base and projected reflection sampling rejects the projection horizon.
- Glass cubemap captures use analytic water shading instead of the main camera's planar image, preventing reflection feedback.
- Reflection validation scans every atlas texel, including roughness mip levels, and rejects any NaN or infinity before material assignment.

### Validation

- Reproduced the prior black-glass failure after repeated lighting changes at the low-angle waterfront view; the old centre samples passed while 48,083 atlas texels were invalid.
- Automated single-invalid-texel regression outside the old sample locations, water capture mode restoration and fallback tests.
- Repeated completed day/night lighting transitions checked in the browser with zero invalid atlas texels.

### Known limits

- Physical Android and low-end GPU validation remains pending.

## [26.1.1](https://github.com/thakurakash-gg/thakurakash-gg/tree/ray-v26.1.1) — 2026-10-16

Prevent black glazing after lighting changes

- Scene/cache ID: `scene-deb1dade10b588d7`
- Preview label: `26.1.1`

### Fixed

- Reflection capture includes the complete sky sphere and excludes glazing that samples the same probe.
- The initial sky and later reflection captures share one retained PMREM generator.
- Invalid or empty reflection maps cannot replace the last valid environment; a prepared sky map is available as a fallback.

### Validation

- Scene/cache integrity and regression checks.
- Automated sky-range, generator reuse, invalid-probe fallback, safe replacement and scene-state restoration tests.
- Browser reproduction at the low-angle waterfront view with repeated lighting transitions.

### Known limits

- Physical Android and low-end GPU validation remains pending.

## [26.1.0](https://github.com/thakurakash-gg/thakurakash-gg/tree/ray-v26.1.0) — 2026-10-16

Visible wall finishes and varied parallax rooms

- Scene/cache ID: `scene-cf2780f26088a52f`
- Preview label: `26.1.0`

### Changed

- Wall finishes use stronger mineral variation, surface relief and panel tones at normal viewing distances; generic concrete is included in the finish assignment.
- All six room styles share a fixed budget of three furniture ray queries per pixel.

### Added

- Six stable room layouts: living room, bedroom, dining room, study, media lounge and quiet sitting room.
- Window-specific furniture mirroring, room depth, wall/fabric/wood palettes, curtain openings, roller shades and warm/cool light variation.

### Validation

- Scene integrity, syntax, cache/update, release-note binding and existing animation/road checks.
- Fresh browser shader compilation and closer daytime/nighttime facade views checked.

### Known limits

- Physical Android and low-end GPU validation remains pending.

## [26.0.0](https://github.com/thakurakash-gg/thakurakash-gg/tree/ray-v26.0.0) — 2026-10-16

Life, water and reliable caching

- Scene/cache ID: `scene-97ef0124be34b244`
- Preview label: `life-26`

### Added

- World-projected wall finishes, box-projected window interiors and animated pool water.
- Layered rooftop palms, 64 terrace details and 31 residents, including 13 walkers.
- Live material/shader diagnostics and a reproducible building geometry audit.
- Versioned changelog and release metadata linked to the scene cache ID.

### Changed

- Ocean waves use a directional spectrum, advected noise and shoreward distance-field crests.
- Traffic uses 104 cars on the high-capability profile and 76 on the balanced profile.

### Fixed

- Scene resources receive content-based cache keys and checksum verification before display.
- Text line endings are normalized before hashing so Windows and published Git bytes match.

### Validation

- Automated cache/update, asset integrity, resident animation, adaptive resolution and mapped-road checks passed.
- Published desktop day/night views, phone-sized layout and repeat cached loads checked.

### Known limits

- Physical Android and low-end GPU validation remains pending.
- The ocean uses analytic waves and noise; a full FFT simulation is not implemented.

Commits: [215524b](https://github.com/thakurakash-gg/thakurakash-gg/commit/215524b), [5ce29c1](https://github.com/thakurakash-gg/thakurakash-gg/commit/5ce29c1), [81014ad](https://github.com/thakurakash-gg/thakurakash-gg/commit/81014ad), [62af9c2](https://github.com/thakurakash-gg/thakurakash-gg/commit/62af9c2), [26f47c0](https://github.com/thakurakash-gg/thakurakash-gg/commit/26f47c0), [99956da](https://github.com/thakurakash-gg/thakurakash-gg/commit/99956da).

## [25.0.0](https://github.com/thakurakash-gg/thakurakash-gg/tree/ray-v25.0.0) — 2026-10-16

Organized renderer and staged loading

- Scene/cache ID: `render-25`
- Preview label: `render-25`

### Changed

- Organized scene source into core, environment, architecture, data and UI modules.
- Reduced the supplied building to 841,223 unique stored triangles and 1,020,284 placed triangles, preserving repeated-floor GPU instancing.
- Added whole-scene preloading, progress and persistent resource caching.
- Retained adaptive pixel density, reflection budgets, complete mapped roads and instanced house fittings/foliage.

### Validation

- Source/resource checks and browser loading, cache and scene checks completed for the earlier release.

### Known limits

- Historical entry reconstructed from the published commit; older preview milestones are not individually backfilled.

Commits: [fff768c](https://github.com/thakurakash-gg/thakurakash-gg/commit/fff768c).
