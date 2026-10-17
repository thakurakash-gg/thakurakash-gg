# Kazeyami studio website

The studio website has six main pages and a dedicated NEXIV brand page. It uses static HTML, locally hosted Manrope, CSS and small shared scripts. The RAY 3D experience has its own runtime and release history; this redesign does not rebuild its scene.

| Page                | Purpose                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| index.html          | Minimal home with the existing Experience Center background film                                                  |
| about.html          | Company, retained interactive logo playground, and Define / Develop / Deliver process                             |
| portfolio.html      | Filters for 3D, NEXIV, Brand / UI/UX and ventures; real project film viewer                                       |
| nexiv.html          | Kazeyami → NEXIV → RAY hierarchy, product introduction and prototype link                                         |
| services.html       | Six service families with expandable deliverables                                                                 |
| team.html           | Seven real people and roles, original fictional anime avatars, profiles and cast remix                            |
| connect.html        | Studio contact, full enquiry form, address, LinkedIn and retained FAQ                                             |
| 3d.html             | Retained medical, miniature, game-asset and game-development practice; project case studies and image interaction |
| design.html         | Retained UI/UX, film and branding practice                                                                        |
| products.html       | Retained Kazeyami Tools and Mock Yatra entries                                                                    |
| ray.html            | Retained detailed RAY product presentation, now under NEXIV                                                       |
| ray-experience.html | Existing interactive 3D prototype, unchanged                                                                      |

## Editing and release

Edit page content directly in the HTML. For rebuilding the shared shell and main pages, edit tools/site/build-pages.py and tools/site/team.json. The builder retains existing detail pages on subsequent runs. New detail pages should use the shared shell.

The presentation styles and behavior live in assets/studio/studio.css, studio.js and enquiry.js. Images and the locally hosted font are in the same folder. Existing project media remains in assets/. The seven original high-resolution PNG portraits are saved privately alongside the project outputs under outputs/Studio-Art/Team; optimized WebP versions are published.

The portraits are fictional alter egos, not photographs or claimed likenesses. Exact names and positions come from the user. Character nicknames and focus descriptions are illustrative editorial copy, not biographical claims. Built-in image generation was used; the complete prompt set is recorded in docs/site/asset-prompts.json.

Run from the website root:

    python tools/site/check-pages.py
    node tools/site/check-enquiry.mjs
    node tools/site/release.mjs
    node tools/site/release.mjs --check

After formatting or changing presentation CSS/JS, regenerate the release keys. Shared asset URLs contain content hashes so subsequent visits load the correct files. Studio version 1.0.1 is separate from RAY scene version 26.5.0.

The enquiry form opens an encoded email draft. It does not send a message or claim a successful submission. No enquiry server or tracking was added. Background film autoplay respects reduced motion, data-saving hints and browser playback restrictions; the play button and poster remain available. Native dialogs provide keyboard focus management and Escape handling.

Inspect home, menu, portfolio filtering and film playback, all team profiles, services, contact fields and the retained project pages on desktop and narrow screens. The previous light/dark preference is available from the footer on editorial pages.

## Original media and licensing

The existing Experience Center, AMD and Mario media is retained. The new portfolio uses a smaller WebP preview for the Mario image. Manrope is redistributed under the SIL Open Font License; see assets/studio/Manrope-OFL.txt.
