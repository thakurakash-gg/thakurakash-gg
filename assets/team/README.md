# Team photographs

The Team page uses a photo-led team grid. The current portrait spaces are intentionally neutral placeholders; no generated or borrowed faces are used.

When approved photographs are supplied, save optimised 4:5 WebP portraits (around 800 × 1000 px) in this folder. In team.html replace the two placeholder spans inside each matching `people-portrait` div with:

```html
<img class="people-photo" src="assets/team/siya-baranwal.webp" alt="" width="800" height="1000" loading="lazy" decoding="async">
```

Use the matching names: siya-baranwal, pragati-saxena, dk, deepraj, shayan-ansari, akash-singh, hammer. Keep the visible name, role and description below the portrait. The wrapper is decorative because those adjacent labels identify the person. Crop consistently and check the face remains visible on mobile. No JavaScript or new dependency is needed.

Layout reference: https://zoa3d.com/team/ — adapted to Kazeyami branding; no ZOA photographs, biographies or assets are reused.
