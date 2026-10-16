# RAY rendering and asset audit

This pass adds world-projected limestone grain and joints to the supplied building's plaster/concrete finishes, box-projected interiors to the source window material, animated pool normals and moving caustics, fuller palms, instanced residents, terrace details and more traffic. Building placement, footprints and curved balcony geometry are preserved.

## Scene activity and instancing

- 31 articulated residents: 13 walking and 18 standing. All people share five geometry/material batches. Animation reuses transform scratch objects and follows the existing pause control.
- 64 terrace details, including side tables, cups, towels, cushions, planted ceramic pots and lanterns. Repeated details share batches.
- 104 cars on the high-capability profile; 76 on the balanced profile. Traffic continues to use four shared part batches and the existing graded road paths.
- Rooftop palms share a 90-triangle frond geometry, with actual individual leaflets in three crown layers, curved trunks and crownshafts. Frond scale follows tree height.
- The tested desktop stage contains 489 instanced batches and 86,680 placements. This includes mapped house fittings, foliage, architecture additions and resident parts. Unique mapped house walls/roofs remain merged in spatial blocks; their distinct footprints are preserved.

## Material and shader counts

The optimized GLB defines **37 materials**. The version 26.0.0 desktop baseline reports:

| Measurement | Count |
| --- | ---: |
| Materials attached to the main scene | 118 |
| Additional presentation-pass material | 1 |
| Explicit ShaderMaterial objects in the scene (sky, ocean) | 2 |
| Additional custom presentation shader | 1 |
| Materials with a shader customization hook | 42 |
| MeshPhysicalMaterial objects | 12 |
| Compiled WebGL program variants after warmup | 116 |

These are different measurements: standard/physical materials also compile shaders, and one material can compile more than one variant for instancing, lights, shadows or other renderer features. Program counts can vary with hardware and which passes have run. The balanced profile can omit the optional presentation pass. The live canvas exposes `data-material-audit`, `data-version`, `data-cache-hits` and the other performance counters for repeatable diagnosis.

## Building geometry

The model remains **10,461,088 bytes**, with **841,223 unique stored triangles** and **1,020,284 placed triangles**, including repeated GPU-instanced floors. The earlier desktop reference contained 2,319,202 triangles. The source retains two repeated-floor GPU batches with nine placements.

Largest stored mesh definitions:

| Source mesh name | Stored triangles | Finish/group |
| --- | ---: | --- |
| Upper floor / Metal Black | 113,830 | Black metal |
| Upper floor / steel | 100,150 | Steel |
| Cube.055 | 93,483 | Painted plaster wall |
| Cube.084 | 75,409 | Rusty metal and light wood |
| Plane.094 | 43,984 | White concrete |
| Football-Argentina-1978.data.004 | 41,397 | Atlas |

The last name is retained from the export; its name alone does not prove that the entire consolidated geometry represents one football prop. Several source meshes combine many components, so this audit distinguishes source mesh names from verified semantic assets.

Across all placed geometry, the largest material groups are steel (377,840 triangles), black metal (234,931), plaster walls (93,483), Atlas (48,539), light wood (45,466) and white concrete (43,984). Steel and black metal together account for about 60% of placed building geometry. See [the generated model audit](model-audit.json) for all groups and the 15 largest stored mesh definitions. Reproduce it with `node tools/ray/audit-model.mjs`.

## Water and FFT decision

The new ocean combines four directional long-wave components with differing wavelengths and gravity-related speeds, shared height/normal equations, warped noise and independently advected fine ripples. Shore waves use positive time in the distance-field phase so that their crests travel toward decreasing distances to land. The encoded field direction is the outward distance gradient; its sign is retained consistently for the normal calculation. Noise breaks up the shore crests and caustics. Static subpixel dithering remains enabled to reduce color steps without animated grain.

FFT is the fast implementation of a discrete Fourier transform and is viable for a larger ocean spectrum. A periodic FFT patch still repeats; increasing the patch size alone does not remove that repetition, and shoreline handling remains a separate problem. For this prototype's broad device target, this pass uses the lighter analytic spectrum and nonperiodic noise rather than adding FFT render-target and transform passes. This is an implementation choice, not a claim that FFT is unavailable on the web.

Primary technical references: [NVIDIA GPU Gems: effective water simulation](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models) and [GPU Gems 2: water displacement](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-18-using-vertex-texture-displacement). These explain the wave approaches; the device/performance tradeoff above is this project's engineering decision, not a current hardware benchmark from those older articles.

## Version selection and cache updates

Each launch checks the current scene manifest over the network. Every asset URL contains its SHA-256 content digest, and both the worker and preload path verify downloaded bytes. Unchanged resources reuse the content cache; changed resources receive new keys. Scripts, the GLB and the shoreline image consume the exact verified preload bytes through staged URLs, preventing mixed versions during deployment.

The release is recorded as complete only after decoding, shader preparation and initial rendered frames succeed. A network failure can reuse the last completed release if the bootstrap is available; failed or partially downloaded releases never replace it. Two completed releases are retained. The generator normalizes text to Git's LF representation before hashing, so Windows checkout line endings cannot invalidate the published checksums.

Run `node tools/ray/manifest.mjs` after changes, then `node tools/ray/check.mjs`. The checks cover manifest integrity, bootstrap version, service-worker update/caching behavior, geometry budgets, finite resident animation, fixed standing positions, pause stability, adaptive resolution, mapped roads and source floor instances.

Browser verification covers initial loading, repeat loads, release changes while reusing unchanged files, day/night shaders, rooftop and waterfront views and a phone-sized viewport. These are desktop-browser checks; physical Android/iPhone and low-end GPU performance remain hardware validation, not inferred from a resized window.

## Version 26.1.0 facade refinement

The earlier finish was too subtle at normal viewing distances. The revision strengthens the limestone mineral clouds, panel color differences and relief, and includes the source generic concrete material. Window interiors now choose among six stable layouts with distinct furniture, finishes, mirrored arrangements, depths, curtain/shade positions and lighting. Each pixel uses only three furniture intersection queries, with no additional material objects. The tested material-object count remains 118 plus the presentation material; the revised desktop shaders reported 43 customization hooks and 118 compiled variants. See the versioned changelog for the exact scene/cache ID.
