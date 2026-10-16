# RAY exterior experience

The published entry point is `ray-experience.html`. `ray.html` is the product page that launches it.

## Source layout

| Folder                         | Purpose                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `assets/ray/core/`             | Startup, capability budgets, rendering, reflections and batching                       |
| `assets/ray/environment/`      | Water, roads, mapped houses, foliage and gulls                                         |
| `assets/ray/architecture/`     | Supplied building integration, glazing, rooftop gardens and club furniture             |
| `assets/ray/ui/`               | Controls, layout and loading screen                                                    |
| `assets/ray/data/`             | Generated mapped geometry and placement data; deliberately compact                     |
| `assets/ray/models/site.glb`   | Optimized model loaded by every device                                                 |
| `assets/ray/models/reference/` | Previous exports retained for comparison and rebuilding; never downloaded by the scene |
| `assets/ray/media/`            | Product-page preview images                                                            |
| `assets/ray/textures/`         | Shoreline distance field                                                               |
| `assets/ray/reference/`        | Unused earlier context implementation, retained as a reference                         |
| `assets/vendor/`               | Shared third-party loader and decoder; do not hand-format                              |
| `tools/ray/`                   | Formatting, validation, asset manifest and repeatable model optimization               |

Authored JavaScript and CSS are formatted source, not a minified bundle. The script order is declared in `tools/ray/script-order.json`. Modules extend the world or neighborhood prototype before the UI constructs the scene. The project remains a static site and needs no application server.

## Rendering and quality

There is no fixed 30 fps limiter. Animation follows requestAnimationFrame. The initial pixel budget uses display density, memory and CPU hints; HDR support and maximum texture dimensions are checked against the renderer. Sustained measured frame/render cost then reduces optional contact shading and reflection resolution before lowering pixel density. Pixel density is never reduced below one physical pixel per CSS pixel and can recover when the device has headroom.

Water reflections update every camera frame. Their target follows the drawing-buffer aspect and adaptive resolution, including portrait phones. Reflection mipmaps, derivative-filtered wave detail, nonrepeating domain warping and subpixel static dithering reduce shimmer, tiling and color steps. The small dither is spatially stable, not animated noise.

Foliage uses spatially grouped InstancedMesh batches. House footprints and compound roofs are unique mapped geometry, merged in neighborhood blocks for frustum culling. Repeated window frames, glazing, doors and garage doors share instanced quads. There are 38,782 villa fitting placements. Matching upper-floor geometry in the building uses two EXT_mesh_gpu_instancing batches with nine placements; transitions and unmatched floors retain their own geometry.

The current building contains 841,223 unique stored triangles and 1,020,284 placed triangles, compared with 2,319,202 in the desktop reference. Its file is 10,461,088 bytes rather than 33,998,072 bytes. Curved balcony finishes use a much tighter simplification error than hidden or tiny metal details. Uniform finishes no longer carry unnecessary texture coordinates and texture maps. Textured wood and other authored finishes are retained.

## Loading and caching

`core/boot.js` preloads every resource in `scene-manifest.json`, with progress weighted by uncompressed resource bytes. It then executes the scripts in order, waits for the model and water texture, warms the shaders, and waits for completed render frames before revealing the stage. A cache hit still goes through model decoding and GPU preparation, so the loader remains visible until preparation finishes.

`ray-sw.js` caches only same-origin RAY resources and its shared renderer/loader dependencies. Subsequent loads use the versioned Cache Storage entries. Other website pages are unaffected. Cache availability depends on browser storage; the normal network path continues to work when service workers are unavailable. Browser storage may be evicted, so this is a repeat-load optimization rather than a promise of permanent offline storage.

## Local workflow

From the website root:

```sh
python -m http.server 8013
npm --prefix tools/ray install
npm --prefix tools/ray run format
npm --prefix tools/ray run manifest
npm --prefix tools/ray run check
```

Use localhost for the preview; service workers need HTTPS or localhost. Rebuild the manifest after editing runtime assets. To rebuild the optimized model, run `npm --prefix tools/ray run model:optimize`, inspect the curves and glazing, then regenerate the manifest.

For a release, increment the release token in HTML, script-order, boot, model URL and manifest generator, and increment the cache name in `ray-sw.js`. This prevents an older cached resource set from mixing with a newer scene.

## Regression checks

The checker validates source syntax and asset paths, the high-density device profile, adaptive resolution bounds, neighborhood road/pavement coverage, and exported floor instancing. Never remove `roadSurfaces` or `pavingSurfaces` when retaining `roadMesh` and `pavingMesh`: these datasets cover different parts of the mapped network.

Also inspect the exterior, waterfront, rooftop and overhead cameras in daylight and at night. Test a narrow viewport, drag through a complete orbit, and reload to confirm `data-cache-hits` increases on the scene canvas. Actual FPS and Android GPU behavior still require representative physical-device testing.
