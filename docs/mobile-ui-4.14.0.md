# Responsive UI review — 4.14.0

Date: 21 October 2026

## Pages and viewports

Home, NEXIV, Kazeyami Studio, Products & Ventures, Services, Work, and Events & Experiences were checked in a browser at 320x844, 390x844, 430x844, 768x844, 844x390 and 1280x800. The final 42 page/viewport combinations had no detected text or control overflow. The 28 phone/tablet combinations had no visible standalone control below the audit's minimum target threshold; corrected controls use 44px minimum dimensions.

RAY was checked at 320x568, 390x844, 667x375, 844x390 and 1280x800. Its landscape stage now fits the viewport, with the reset, lighting and orbit controls visible. Views, help and the airport route-map panels are bounded and scroll when required.

## Changes verified

- Direction captions remain inside their rows at 320px.
- Contact headings, copy and form fields fit narrow screens.
- Studio film cards stack on small phones with readable captions.
- Two delayed Studio images have their intrinsic dimensions reserved.
- Product venture rows and links fit without exceeding the content width.
- The menu opens as a right-side drawer; Escape closes it.
- FAQ content expands inside the screen.
- Project film dialogs fit a 390x844 viewport; closing pauses the player.
- The home film's selected source reports 1920x1080, replacing the 720x406 mobile source. The 1,082,440-byte file already has its playback metadata before its media data.
- Decorative marketing arrows are SVGs, with no emoji backgrounds or added icon library.
- The team directory contains all seven approved names, roles and responsibility descriptions, with no anime assets or interaction dependency.
- The team and contact sections were inspected in light and dark mode.
- RAY lighting, pause/resume and reset controls respond, and landscape panels remain usable.

## Automated checks

The home, identity, team and seven-page launch audits pass. The launch audit checks 358 local references with no errors. The existing full RAY scene/resource/cache/lifecycle/geometry suite also passes.

## Reference

The team hierarchy was informed by [Kojima Productions' careers presentation](https://www.kojimaproductions.jp/en/careers) and its [staff profiles](https://www.kojimaproductions.jp/en/Staff-interview-01). No third-party photographs or artwork were copied.

## Limits

These are browser viewport checks, not tests on physical iOS or Android hardware. Native email applications, OS share sheets and device-specific video autoplay policies were not exercised. The enquiry form prepares a local draft and does not submit to a server.
