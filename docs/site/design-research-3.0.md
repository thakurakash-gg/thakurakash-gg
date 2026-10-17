# Studio 3.0 — research and design decisions

## What needed changing

The 2.0 home ended after its opening film. Its header described a larger studio, but scrolling did not reveal that studio. Repeated arrows, asterisks, numbered labels and short slogans competed with the actual work. The same charcoal and pink treatment made unrelated practices look interchangeable.

The new home needs to answer four questions: who is Kazeyami, what does it make, what can I explore, and how do I contact the studio?

## References reviewed before implementation

### Lusion

Sources: [official studio site](https://lusion.co/) and its project navigation.

The browser review showed a direct description of the studio above a large interactive visual. Below the entrance, the page introduces the studio's approach and featured projects. The opening establishes craft; the following sections explain the work.

Applied: put a concrete description before the visual, give the visual a contained frame, and continue into real projects. Kazeyami uses its own films and images rather than the reference's artwork or wording.

### MONOGRID

Source: [Awwwards site breakdown](https://www.awwwards.com/sites/monogrid-com).

Awwwards documents the homepage scroll, 3D WebGL scroll, project transitions, studio information and contact as separate parts of the experience. This is useful as an information-architecture reference, rather than a palette to copy.

Applied: build a complete home journey with actual sections. Keep normal browser scrolling and direct anchors, so the experience still works without 3D.

### Boc.Studio

Source: [official studio site](https://boc.studio/).

The browser review showed large project media, visible project names and access to case studies. Its identity and motion create a strong visual signature around the work.

Applied: let Kazeyami's real project media provide most of the visual character. Keep the typography and controls restrained; avoid importing the reference's more aggressive color and motion treatment.

### Additional reference considered

[Unseen Studio](https://unseen.co/) and its [Awwwards profile](https://www.awwwards.com/unseenstudio/) were reviewed for an immersive studio approach. The browser session exposed its introductory loading state, so it was not treated as a completed visual walkthrough.

## Direction for Kazeyami

- A warm, light gallery foundation rather than a full-site neon treatment.
- Clear sans-serif text, with restrained serif emphasis in the introduction.
- The existing Kazeyami logo retained.
- Color tied to the content: sage for studio information, forest for NEXIV/RAY, muted lilac for people and warm clay for contact.
- Specific titles and descriptions instead of abstract slogans.
- Real project films, descriptive links and a clear NEXIV → RAY relationship.
- Home sections for selected work, studio, NEXIV/RAY, services, team and contact.
- A lightweight Three.js display of actual studio work; no unrelated icons, particles or cursor effects.

## Rendering and loading choices

The new display is separate from the RAY renderer. It uses three image/film panels, their captions, a floor and four instances of one rounded plinth geometry. A local browser check reported 11 draw calls and 3,778 triangles.

The gallery caps render-target area at 1.35 million pixels and pixel ratio at 1.6, with a lower cap and no shadow map on memory-constrained devices. Rendering and video playback stop when off-screen or when the tab is hidden. Motion and data-saving preferences start with a static image layout; the visitor can explicitly enable 3D.

The existing Experience Center film is the only background video. Other project films load when requested. The homepage does not download RAY's model, HDR maps, a post-processing stack or a new framework.

The fallback layout is present before the renderer loads and remains visible if WebGL is unavailable. The rest of the page is normal HTML and is never hidden behind a loading screen.

## Validation

- All 11 page structures, local links, anchors and retained content.
- Real team names and roles, including links from home to the selected team member.
- Real film playback and reviewable email-draft encoding.
- Real Three.js geometry and rendering-policy regression checks.
- Desktop and phone layout checks, including normal anchor navigation.
- Versioned shared assets, Git checkpoints and release changelog.

These references informed structure and craft. No third-party artwork, branding or site copy is included.
