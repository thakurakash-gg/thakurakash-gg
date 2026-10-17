# Kazeyami studio website

Studio release **3.0.0** is a complete presentation redesign. The public site is a static build with 11 pages, a warm gallery visual system with distinct section palettes, locally hosted typography and small page-specific interactions. The RAY scene remains independently versioned at 26.5.0.

## Page map

| Page | What visitors can do |
| --- | --- |
| index.html | Explore a lightweight 3D project display, then scroll through work, studio, NEXIV/RAY, services, team and contact |
| about.html | Learn about the studio, play with its existing 3D logo scene, and read the project process |
| portfolio.html | Filter actual project films and clearly labeled practices; discover NEXIV → RAY |
| services.html | Explore six service families and their deliverables |
| team.html | Select seven original anime alter egos to see exact real names and studio roles |
| connect.html | Find studio contact details, prepare a reviewable email enquiry, and read the FAQ |
| nexiv.html | Understand the Kazeyami → NEXIV → RAY hierarchy and launch the exterior demo |
| ray.html | Explore the platform story, live-demo preview and retained Experience Center film |
| 3d.html | Preview AMD and Mario films, read retained process/delivery case studies, and use image effects |
| design.html | Explore brand, UI/UX and motion practice through a labeled interactive design study |
| products.html | Find NEXIV, Kazeyami Tools and Mock Yatra with honest introduction statuses |

## Editing

- **Page content:** tools/site/templates/*.html. These are complete, readable content fragments.
- **Shared navigation, document head, footer and page metadata:** tools/site/build-pages.py.
- **Real team roster and editorial character descriptions:** tools/site/team.json.
- **Foundation and shared interactions:** assets/studio/studio.css and studio.js.
- **Current palette, typography and home layouts:** assets/studio/gallery.css.
- **Optional home WebGL display:** assets/studio/home-gallery.js.
- **Email-draft encoding:** assets/studio/enquiry.js.
- **Single release version/date:** tools/site/version.json.
- **Generated outputs:** root HTML files and assets/studio/manifest.json.

Do not edit generated page content in isolation: the next build will replace it. Existing RAY runtime files are outside this page builder.

Build and verify from the website root:

    python tools/site/build-pages.py
    node tools/site/release.mjs
    python tools/site/check-pages.py
    node tools/site/check-enquiry.mjs
    node tools/site/check-gallery.mjs
    node tools/site/release.mjs --check

The optional formatter can run on the 11 marketing pages and shared presentation files before release generation. Do not apply broad formatting globs to the independently managed RAY runtime.

The release helper fingerprints all presentation assets and writes content hashes into shared CSS/JS URLs. Rebuild release keys after any presentation asset edit. GitHub Pages serves the static site; the studio does not add a second service worker or interfere with the RAY cache.

## Interaction and access

The home contains substantive sections for work, studio, NEXIV/RAY, services, people and contact. Its header links scroll directly to these sections; standalone pages remain accessible through descriptive links.

The Three.js display is optional. It uses 11 draw calls and 3,778 triangles in the measured desktop scene, a capped render-target area, and one local 1.08 MB film. It renders only while visible, pauses in hidden tabs, and disables shadows on memory-constrained devices. Reduced-motion and data-saving settings start with static previews. No RAY scene models or post-processing pipeline load on the home.

Native dialogs provide Escape handling and focus containment. Portfolio filters, film controls, roster selection and the design study use real buttons with selection states. Mobile team selection scrolls back to the updated character. Phone form controls use readable text sizes.

The enquiry form prepares an encoded mailto draft to hr@kazeyami.com. Nothing is sent automatically, and the site does not claim a completed submission. Native validation checks required name, email and message fields.

## Media and references

Existing Experience Center, AMD and Mario media is retained. AMD and Mario now use compact WebP posters. All seven original avatar images are fictional alter egos, not photographs or claimed likenesses. Exact names and roles were provided by the user. Character nicknames and focus descriptions are illustrative copy, not additional biographical claims. Original image-generation prompts remain in docs/site/asset-prompts.json; full-resolution originals remain in the private project outputs.

The 3.0 research reviewed Lusion, MONOGRID’s Awwwards breakdown and Boc.Studio, with an additional look at Unseen. Findings and limits are recorded in docs/site/design-research-3.0.md. Their artwork, logos and copy are not included in this site.

Fonts are redistributed under their SIL Open Font Licenses: assets/studio/Manrope-OFL.txt and Space-Grotesk-OFL.txt.

Validation includes all internal resources/anchors, exact team facts, retained content, email encoding, presentation release keys, desktop/phone browser checks and the complete RAY regression suite.
