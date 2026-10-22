# Blue Hour / Kazeyami LIVE 1.1.0

Original, independent concert stage concept imagined for Ado. Not a commissioned show or an announcement of an actual event. Published under Events & Experiences, separate from NEXIV and RAY.

## Venue and show

- Odaiba / Shiokaze Park context using local, preprocessed OpenStreetMap geometry. No runtime map API or third-party map requests.
- Expanded Tokyo coastline and skyline with 3,529 mapped building footprints and parts. Facade windows, floor ledges, rooftop detail, road markings, street furniture and instanced leaf-cluster trees.
- RAY-derived sky, water and presentation methods: cloud and horizon shading, directional water waves, Tokyo-specific shoreline tides, reflected scenery, PBR materials, cached soft shadows and desktop contact shading. Compact devices use a lighter presentation path.
- Unobstructed main scene, with the former left editorial block removed. Daylight is the initial view.
- Original sculptural stage canopies, trusses, catwalk, silhouette performance chamber, band risers, LED panels, PA arrays, technical compound, audience areas, concessions and front-of-house position.
- Four camera presets plus pointer, touch and keyboard orbit, pan and zoom.
- Day/night lighting; three looks; a 36-second show that finishes rather than looping.
- 24 virtual moving heads, eight channels per fixture. Group dimmer and RGB adjustments, movement toggle and DMX patch readout. No Art-Net, sACN or hardware connection.
- One-shot fireworks preview using a bounded particle pool. No audio or artist recordings.

## Performance and accessibility

Static geometry is batched by material. Trees and crowd use instancing. Pixel ratio is capped and drops to 1 after sustained slow frames. The scene pauses in hidden tabs and disposes resources on page exit. Marketing pages do not preload the scene or Three.js. Reduced motion freezes continuous shader/moving-beam animation, snaps camera transitions and replaces fireworks with a static finale. Keyboard controls, labelled controls, visible focus, a dismissible native dialog and a WebGL/network failure state are included.

## Geographic limits and attribution

Coastline, road/path alignments and building footprints are derived from © OpenStreetMap contributors, licensed under ODbL 1.0: https://www.openstreetmap.org/copyright. The derived data is available in assets/live/odaiba.json under that license. See concept.json for origin, retrieval date and source digest.

Building heights where unavailable, planting, landscape elevations and landmark detailing are approximate. The proposed layout is an exploratory visualization, not a surveyed event plan. The event footprint and all stage, lighting, screen artwork and effect designs are original concept work.

Site reference: https://www.gotokyo.org/en/spot/856/index.html

## Preview

Serve the static site and open live-experience.html. No build dependencies or application server are required. Entry point: events.html → Blue Hour.
