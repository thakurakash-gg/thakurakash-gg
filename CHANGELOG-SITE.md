# Website changelog

## 4.5.0 - 2026-10-18

- Replace the temple menu background with three slowly moving folded-metal ribbons in champagne, silver and muted copper. Keep the existing menu links, layout and right-side slide.
- Use studio reflections, subtle pointer parallax and a dark text scrim. The scene is created on first open, uses three mesh draws, caps pixel density and frame rate, and pauses while closed or hidden. Reduced motion shows a still.
- Retain the gold katana entrance, current headline, theme behaviour and RAY scene. Refresh content-hashed assets.


## 4.4.0 - 2026-10-18

- Replace the opening slogan with Design and technology studio, followed by a small Lucknow, India location. Remove the previous kicker and crafted-by credit.
- Replace the ivory grip with interlaced antique-gold fittings and shared sculpted floral relief. Add matching curved gold scabbard collars and original metallic botanical inlay in place of the red ribbons.
- Add a 940 ms action-style entrance: grip from the left, blade from the right, fast sheathing and a brief settling recoil. It begins at the first rendered frame, does not block page loading, yields to interaction and respects reduced motion.
- Preserve blade extraction, the cursor pixelation, dark opening and collaboration surfaces, and the existing direction section. Refresh asset cache keys and the static fallback.


## 4.3.2 - 2026-10-18

- Keep the katana opening and every collaboration section dark in both themes, including the video treatment, text and enquiry fields.
- Keep the fixed home header readable as it moves between dark sections and the light-mode content. Other sections still follow the theme switch.


## 4.3.1 - 2026-10-18

- Keep the menu close icon readable over pale headers on subpages and after scrolling. Preserve the moon and lantern colours through the atmospheric fog.


## 4.3.0 - 2026-10-18

- Rebuild cursor pixelation as a render pass on the katana itself: broad, opaque grid cells trail the pointer and resolve back to the original image. Remove floating square particles.
- Restyle the studio heading with a smaller introductory line and an open, italic serif question.
- Make light mode use warm pale surfaces, dark text, correct logos and a brighter studio film across the marketing site.
- Add an original procedural temple backdrop behind the existing sliding menu, with lanterns, rain, leaves and pointer parallax. Load on first open and stop animation when closed; reduced motion uses a still scene.
- Version the shared theme and menu assets, retain the direction section, and update input, layout and theme verification.


## 4.2.0 — 2026-10-18

- Use the existing studio film behind the home katana and keep the studio link at the lower right.
- Repair katana click, drag and scroll intent; add raised woven grip straps, a continuous gold guard rim and a beveled blade collar.
- Add a lightweight pixel cursor trail on home for fine pointers, with reduced-motion support.
- Make the process section full width and FAQ hover/focus text readable.
- Use a render of the actual full-detail RAY Blender scene at dawn for NEXIV. Preserve native controls and omit the map in the thumbnail only. Keep restrained exposure and no contrast filter.
- Refresh marketing asset versions; check preserved direction content, mesh geometry, input behavior and responsive layouts.


## 4.1.0 — 2026-10-18

- Present NEXIV as Kazeyami’s architecture branch and RAY as its interactive
  platform. Add the NEXIV architecture page, update branch navigation and the
  first direction row, and redirect the old ray.html address.
- Keep the RAY prototype and product identity, with a return link to NEXIV.
- Set sales@kazeyami.com as the contact address across every website page, RAY
  prototype, project enquiry link and generated email draft.
- Version shared enquiry scripts so subsequent loads use the new address.

## 4.0.1 — 2026-10-18

- Restore the original top-right hamburger menu and panel that slides in from the
  right, plus the previous light/dark switch on desktop and mobile.
- Remove the home page’s Pause motion control; keep automatic reduced-motion support.
- Reuse the original floating Kazeyami logos behind “Let’s collaborate” only, with
  the existing copy and enquiry form. Batch the 27 marks into three instanced meshes
  and stop background animation outside the viewport or while the tab is hidden.
- Replace overlapping blade/tip surfaces with a single welded blade. Give the
  sheath an open mouth, inner walls and a closed rear end.
- Keep the sheath fixed and draw the blade along its matching circular spine.
  Adjust framing to keep the extracted blade visible across screen sizes.
- Check mesh closure, nondegenerate triangles, extraction alignment, header
  controls, phone layout and the retained “Find your direction” section.

## 4.0.0 — 2026-10-18

- Build a new Kazeyami opening from the requested StringTune reference: dark
  composition, large typography, compact translucent controls and scroll progress.
- Add an original procedural 3D katana with a textured sheath, curved blade,
  interlaced grip, scroll reveal, pointer parallax and manual draw/sheathe controls.
- Preserve “Find your direction” exactly, including its layout, text, films and links.
- Retain the studio film, project pages, enquiry form, FAQ and existing RAY experience.
- Add responsive layouts, motion pause, reduced-motion handling and a static
  fallback. Render only on interaction and load the film when visible.
- Version the homepage runtime URLs; document the reference analysis and build.
- Validate desktop/phone layouts, navigation, model controls and retained content.

## 3.0.1 — 2026-10-17

Restore the website to its layout before the entire-site redesign, as requested.

- Restore the original home, RAY presentation, 3D Studio, Design and Products pages from commit 0e8116c.
- Remove the six-page studio redesigns and their added presentation assets.
- Preserve RAY scene version 26.5.0, including the existing geometry, rendering and performance improvements.
- Record the restoration as a new Git commit; earlier versions remain available in history.
