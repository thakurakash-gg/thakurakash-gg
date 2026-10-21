# RAY 26.8.0 — loading sequence and central seawall

21 October 2026

The loading screen uses four 1600x900 WebP captures from the actual platform: afternoon waterfront, terraces, neighbourhood and night waterfront. No generated imagery or external artwork is used. The first shot loads directly from HTML. Later shots load one at a time, with only two image layers and a randomized sequence. All four captures together remain below 600 KB.

Loading artwork is marked optional in the content manifest. It does not join the required scene download queue or delay the readiness handoff. Reduced-motion and data-saving preferences keep a still image; hidden tabs suspend the timer. Image errors preserve the current shot. Scene readiness or a startup error stops the sequence.

The earlier vertical phone tool rail and control styling are restored. Small viewport and dialog bounds remain, with a narrow landscape adjustment that keeps the original control groups reachable. The sound button, help description, audio module and water/bird/wind recordings are absent from the active release.

The central seawall problem came from two generated bank spans following a land bulge outside the supplied wall's curve. The authored wall now owns those complete spans. A 12 cm setback removes 6.75 square metres of upper cap and 1.77 square metres of underlying cap in that same small area. The supplied model, mapped coastline, islands and north-inlet fill remain intact. The correction mask and measured areas are recorded in seawall-ground-repair.json.

Validation:

- Loader layouts fit 320x568, 390x844, 667x375, 844x390 and 1280x800 browser viewports.
- The restored phone controls fit the first four of those viewports.
- Browser inspection confirms the slideshow changes shots and the actual loader disappears when the scene is ready.
- A matching close-up before/after capture shows the green rectangle removed from the white curved wall.
- Rendered ground triangulation has less than 0.001 square metres of overlap with the repaired exclusion region.
- Loading lifecycle, banks, terrain, planting, cache and existing scene checks pass, as do the seven-page marketing checks.

These are browser viewport checks rather than physical phone tests. A quick cached load may finish before the second shot; there is no forced minimum loading time.
