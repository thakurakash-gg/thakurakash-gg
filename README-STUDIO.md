# Kazeyami studio website

Studio release **2.0.0** is a complete presentation redesign. The public site is a static build with 11 pages, a shared dark/light visual system, locally hosted typography and small page-specific interactions. The RAY scene remains independently versioned at 26.5.0.

## Page map

| Page | What visitors can do |
| --- | --- |
| index.html | Watch and switch between three actual studio project films; pause playback; enter the work |
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
- **Design and interactions:** assets/studio/studio.css and studio.js.
- **Email-draft encoding:** assets/studio/enquiry.js.
- **Single release version/date:** tools/site/version.json.
- **Generated outputs:** root HTML files and assets/studio/manifest.json.

Do not edit generated page content in isolation: the next build will replace it. Existing RAY runtime files are outside this page builder.

Build and verify from the website root:

    python tools/site/build-pages.py
    node tools/site/release.mjs
    python tools/site/check-pages.py
    node tools/site/check-enquiry.mjs
    node tools/site/release.mjs --check

The optional formatter can run on the 11 marketing pages and shared presentation files before release generation. Do not apply broad formatting globs to the independently managed RAY runtime.

The release helper fingerprints all presentation assets and writes content hashes into shared CSS/JS URLs. Rebuild release keys after any presentation asset edit. GitHub Pages serves the static site; the studio does not add a second service worker or interfere with the RAY cache.

## Interaction and access

The home loads one background film at a time. Autoplay respects reduced-motion preferences, data-saving hints and browser restrictions. A poster and explicit playback control remain available. Hidden tabs pause playback.

Native dialogs provide Escape handling and focus containment. Portfolio filters, film controls, roster selection and the design study use real buttons with selection states. Mobile team selection scrolls back to the updated character. Phone form controls use readable text sizes.

The enquiry form prepares an encoded mailto draft to hr@kazeyami.com. Nothing is sent automatically, and the site does not claim a completed submission. Native validation checks required name, email and message fields.

## Media and references

Existing Experience Center, AMD and Mario media is retained. AMD and Mario now use compact WebP posters. All seven original avatar images are fictional alter egos, not photographs or claimed likenesses. Exact names and roles were provided by the user. Character nicknames and focus descriptions are illustrative copy, not additional biographical claims. Original image-generation prompts remain in docs/site/asset-prompts.json; full-resolution originals remain in the private project outputs.

The visual research considered the official websites of Active Theory, BUCK and Embark Studios: immersive media, clear work hierarchy and distinct project identities. Their artwork, logos and copy are not included in this site.

Fonts are redistributed under their SIL Open Font Licenses: assets/studio/Manrope-OFL.txt and Space-Grotesk-OFL.txt.

Validation includes all internal resources/anchors, exact team facts, retained content, email encoding, presentation release keys, desktop/phone browser checks and the complete RAY regression suite.
