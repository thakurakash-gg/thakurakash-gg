# RAY changelog

Product versions describe published milestones; scene/cache IDs identify the exact runtime assets. Version 26.0.0 introduces this maintained log and corresponds to the existing life-26 preview. Historical coverage begins with render-25.

Future releases use MAJOR.MINOR.PATCH: breaking changes, enhancements, then fixes. Runtime changes require a new entry; documentation-only changes may keep the same scene/cache ID.

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
