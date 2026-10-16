# RAY changelog

Product versions describe published milestones; scene/cache IDs identify the exact runtime assets. Version 26.0.0 introduces this maintained log and corresponds to the existing life-26 preview. Historical coverage begins with render-25.

Future releases use MAJOR.MINOR.PATCH: breaking changes, enhancements, then fixes. Runtime changes require a new entry; documentation-only changes may keep the same scene/cache ID.

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
