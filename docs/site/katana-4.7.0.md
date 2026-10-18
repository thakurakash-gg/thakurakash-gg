# Studio 4.7.0 — reference katana and interactive wordmark

The katana now follows the supplied black-and-gold reference. Its grip uses two closed cotton ribbons crossing over textured ivory rayskin; alternating lifts prevent crossing surfaces from sharing a plane. The antique-gold guard has a landscape relief texture, and the blade collar carries lattice engraving. The black lacquer scabbard has locally drawn gold dragon artwork on both broad faces, a matching metalness/bump mask, paired fine gold bands, and one merged rope mesh for the patterned sageo and tied ends. No model or texture is downloaded from an external service.

`katana-finish.js` keeps material artwork separate from the scene. The existing closed blade and hollow scabbard geometry, circular extraction path and subsecond initial assembly remain intact. The resting pose follows a horizontal chord above the studio name.

Only the scabbard dissolves during docking; the grip remains attached. The landing scale and center include the handle. Scrolling upward back into the opening reverses the 2.1-second flight, followed by re-sheathing. An upward wheel or touch gesture at scroll position zero also reverses it. Menu gestures are ignored. Reduced motion skips both flights, and the renderer returns to idle when motion settles.

`katana-wordmark.js` measures the original DOM wordmark and copyright glyph, draws their font metrics into a local texture, and includes that plane in the same cursor pixelation pass as the katana. The original DOM typography supplies layout and returns on WebGL loss. The texture resizes with the viewport and old textures are disposed. Pixel motion is restricted to the opening and respects the existing fine-pointer/reduced-motion conditions.

Validation:
- Homepage assets, protected direction-section hash, marketing routes and sales/NEXIV identity checks.
- Closed blade and scabbard meshes, concentric extraction, subsecond assembly, touch axis locking and drag completion checks.
- Flight checks confirm cover-only dissolution, retained handle, symmetric return timing, held-drag isolation and reduced-motion return.
- Browser checks on desktop and at 390×844: reference finish, sharp wordmark, visible wordmark pixelation, docking with the grip retained, upward-wheel reversal and a restored scabbard. The compact menu remains at 76vw with its shared floating marks. No console errors were observed. Physical-device performance has not been measured in this desktop preview.

The RAY scene and approved Find your direction section remain unchanged.
