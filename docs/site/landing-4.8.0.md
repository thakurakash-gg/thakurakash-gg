# Studio 4.8.0 — lower wordmark landing

The initial assembly retains its existing timing: the two parts enter from opposite sides, align, and the blade is fully sheathed by 0.72 seconds. A smooth landing begins at 0.82 seconds and reaches the new lower position by 1.4 seconds; the complete non-blocking entrance lasts 1.48 seconds.

The resting anchor is measured from the large Kazeyami wordmark. The katana spans its width and follows its lower edge at a slight upward angle, with a bottom limit that reserves space for the guard, ribbon and small footer text. The initial assembly position remains above the wordmark, then interpolates to this anchor after closure. The static unavailable-WebGL illustration also sits at the lower edge.

The existing drawing and docking controller is retained. An extracted sword recenters before its upward flight; the reverse flight restores the cover and returns to the new resting anchor before sheathing. The handle remains attached, and only the cover dissolves. Reduced motion skips the entrance and starts at the resting pose.

The wordmark plane now stays behind all of the katana, avoiding letters covering the left side when their projected positions overlap. Its DOM measurements and cursor pixel effect remain intact.

Validation:
- Entrance checks confirm closure precedes landing, the sword stays sheathed during the landing, landing progress is monotonic, and the final pose is stable.
- Existing closed geometry, extraction, touch input, route/identity and symmetric docking-flight checks pass.
- Desktop and 390×844 browser checks confirm the lower placement and no console errors. Drawing reaches the header and reversing returns to the new lower position. Video brightness and the white draw control are retained.
