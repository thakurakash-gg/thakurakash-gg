# Kazeyami LIVE — Blue Hour 1.2.5

The website is a lightweight visual preview of an original concert stage in Shiokaze Park, Odaiba, Tokyo. The complete event authoring scene and DMX rehearsal belong to the separate Unreal Engine project. Website controls do not send DMX or connect to equipment.

## Website preview

Four camera views, day/night, colour and intensity controls, three programmed looks and a finite 36-second show. The controller sits beside the scene on desktop and opens as a compact panel on phones. Fireworks are bounded visual particles. There are no artist recordings or background audio.

The environment uses 45 textured PLATEAU 2025 LOD2 building tiles aligned to 139.76935 E / 35.62635 N, official aerial ground imagery, separate modeled lawns, paths and coastal planting. The proposed stage is positioned in the park facing the Odaiba skyline.

Desktop city data uses a 14.4 MB compressed model; phones receive a 6.9 MB variant. Both use Meshopt and WebP facade textures. Tree canopies use baked views from a CC0 model, combined with solid branches and instanced placement. Phones use fewer trees and people, smaller reflections and capped pixel ratio. The scene pauses in hidden tabs. Reduced motion freezes continuous movement and replaces fireworks with a static finale.

## Source and scope

- Tokyo buildings and aerial imagery: [Project PLATEAU / MLIT](https://www.mlit.go.jp/plateau/site-policy/), processed by Kazeyami. Geographic context, not a detailed architectural survey.
- Coastline and road/path data: [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL 1.0. Derived geometry is included in assets/live/odaiba.json under that licence.
- Coastal foliage: [Poly Haven island_tree_01](https://polyhaven.com/a/island_tree_01), CC0, Rico Cilliers and Rob Tuytel. Optimized multi-view canopies were rendered from the source model.
- Original stage architecture, layout and screen artwork: Kazeyami.

This is an independent, uncommissioned concept imagined for Ado, with no artist or venue affiliation. Landscape elevations and planting are approximate. It is not a surveyed event plan.

## Unreal counterpart

Unreal is the primary event-design workspace: editable geometry, a native DMX library and console, 24 moving heads, four canopy wash emitters, five LED screen surfaces, two animated smoke VFX outlets and three fireworks launchers. Five internal DMX universes provide separate lighting, smoke, fireworks, screen and wash groups. The browser is a separate presentation layer.

Serve the static site and open live-experience.html. Entry point: Events & Experiences → Blue Hour. No application server or runtime map API is needed.
