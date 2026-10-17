# Studio website changelog

## 3.0.0 — 2026-10-17

Rebuild the home as a complete studio presentation after reviewing studio work on Awwwards and official reference websites.

- Add substantive home sections for selected projects, studio, NEXIV/RAY, services, seven team members and contact. Header links now scroll to the corresponding sections.
- Replace the film-only entrance with a restrained introduction and a small Three.js display using Kazeyami’s own project media.
- Use a warm gallery foundation with sage, forest, lilac and clay surfaces; remove repeated decorative arrows and asterisks, and simplify headings and copy.
- Keep film viewing, case studies, service disclosures, enquiry, the original team avatars and standalone practice pages.
- Link home team portraits to their selected profiles.
- Limit the new gallery to 11 measured draw calls and 3,778 triangles; cap pixel area and device ratio, reduce shadows on memory-constrained devices, and pause rendering/video off-screen and in hidden tabs.
- Provide static previews for reduced-motion/data-saving preferences and WebGL failure; load the 3D library only when the gallery is requested or visible.
- Remove unused 2.0 home styles and document the research, source structure and rendering checks.

Validation: page/resource/anchor checks, home-section and team facts, email encoding, real Three.js geometry and rendering-policy checks, desktop/phone browser QA and independent RAY regressions. RAY remains at 26.5.0.

## 2.0.0 — 2026-10-17

A complete redesign around the studio’s actual work, with a consistent visual system across all 11 presentation pages.

- Replace the mixed paper/editorial layouts with charcoal, off-white and Kazeyami pink; self-host Space Grotesk and Manrope.
- Make desktop navigation visible and give mobile navigation six direct routes.
- Build a cinematic home with three selectable project-film channels, real playback progress, pause/play and individual project links. Keep only one background film active.
- Rewrite the introduction, services and product copy around what the studio makes and what visitors can explore.
- Present real project films separately from labeled practices and ventures; preserve filtering and detailed process/delivery case studies.
- Give the team an interactive character-selection layout with all seven exact names/roles and existing original anime avatars.
- Add a clearly labeled interactive design study with palette and composition controls.
- Retain the 3D logo playground, image effects, process, FAQ, contact fields, product entries and Kazeyami → NEXIV → RAY hierarchy.
- Move all page content into readable templates and centralize release version/date in tools/site/version.json.
- Use optimized AMD and Mario WebP posters; preserve reduced-motion/data-saving playback and accessible controls.

Validation: 11-page resource/anchor and content checks; exact team facts; email-draft encoding; content-hash verification; desktop and phone browser inspection; full RAY regression suite. RAY remains at 26.5.0.

## 1.0.1 — 2026-10-17

- Correct portrait and RAY-preview image scaling when explicit image dimensions are present, so card heights follow their responsive width.
- Verified the complete cast at desktop and phone widths with no horizontal overflow.

## 1.0.0 — 2026-10-17

A six-page redesign for Kazeyami Innovations, with NEXIV as the brand behind RAY.

- Minimal home page with the existing architectural studio film as its background.
- Separate About, Portfolio, Services, Team and Connect pages with shared navigation.
- NEXIV brand page and clear Kazeyami → NEXIV → RAY product hierarchy.
- Filterable work, actual AMD and Mario films, and retained detailed practice pages.
- Seven original fictional anime avatars, exact real names/positions, character profiles and a cast-remix interaction.
- Existing interactive logo scene, project-image interactions, process, ventures, FAQ and contact details retained in the new structure.
- Responsive layouts, accessible native dialogs, reduced-motion/data-saving playback behavior and editorial light/dark preference.
- Encoded email-draft enquiry flow with no automatic sending.
- Fingerprinted presentation assets and independent studio versioning.

Validation: internal file/anchor and page checks; exact team facts; email encoding regression; desktop and phone browser inspection; RAY scene regression suite.

The existing RAY scene remains at 26.5.0. Its own history is in CHANGELOG-RAY.md.
