# Studio 4.6.0 — compact navigation and a clear hero

The phone drawer now occupies at most 300px or 76% of the viewport. Its links have 44px touch targets, and the drawer can scroll on short screens. Header surfaces no longer cover its background in light mode.

`logo-background.js` contains the original collaboration symbol geometry and three instanced color batches. The contact and menu wrappers share that implementation. Navigation creates its scene on first opening; contact pauses while the menu is open. Both stop animation while hidden and respect reduced motion. Inner pages load the existing local Three.js runtime only when needed.

The initial katana pose is horizontal above the large studio name. Drawing first extracts the blade along the existing concentric spine. On release, after the blade clears the scabbard, a 2.1-second flight shrinks it toward the measured header wordmark. The scabbard dissolves first, followed by the hilt, with one 24-point gold particle batch. Material clones isolate dissolution from the remaining silver blade. The blade then becomes a small horizontal accent beneath the logo and stays fixed with the header during scrolling. The draw button reverses the action.

Touch input locks to the first deliberate gesture axis: horizontal swipes draw, vertical swipes remain page scrolling. Reduced motion skips the entrance and flight. The renderer stops requesting frames after the pose settles; opening the menu also pauses the hero.

Validation:
- Homepage route, local assets, protected direction-section hash, contact and NEXIV identity checks pass.
- Closed blade/scabbard geometry and concentric extraction checks pass.
- Input checks cover rapid toggles, incidental input, touch scrolling, horizontal touch drawing and drag completion.
- Motion checks cover held drags, entrance isolation, blade clearance, docking, dissolution, reversal and reduced motion.
- Browser checks at desktop, 390×844 and 320×568 confirm layout, drawing, docking, continued header alignment, reversal, the shared background, 44px links and Escape dismissal. NEXIV’s lazy menu renderer starts without console errors. Physical-device testing remains outside this desktop check.

RAY and Find your direction are unchanged.
