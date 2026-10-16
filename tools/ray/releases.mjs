/* A documented product version maps to an exact scene/cache release, not a URL token. */
import assert from "node:assert/strict";
export function validateReleases(history, sceneVersion) {
  assert(Array.isArray(history.releases) && history.releases.length, "Release history is empty");
  const versions = new Set();
  let previous = null;
  for (const release of history.releases) {
    assert(/^\d+\.\d+\.\d+$/.test(release.version), `Invalid product version: ${release.version}`);
    assert(!versions.has(release.version), `Duplicate release: ${release.version}`);
    versions.add(release.version);
    const parts = release.version.split(".").map(Number);
    if (previous) {
      const difference =
        parts.map((value, i) => value - previous[i]).find((value) => value !== 0) ?? 0;
      assert(difference < 0, "List releases newest first");
    }
    previous = parts;
    assert(
      /^\d{4}-\d{2}-\d{2}$/.test(release.date) && Number.isFinite(Date.parse(release.date)),
      "Invalid release date",
    );
    assert(release.title && release.sceneVersion && release.preview, "Incomplete release metadata");
    assert(
      Object.values(release.changes || {}).some((items) => Array.isArray(items) && items.length),
      "Add meaningful release notes",
    );
    assert(release.validation?.length, "Record release validation and any limits");
  }
  assert.equal(
    history.releases[0].sceneVersion,
    sceneVersion,
    `Scene changed to ${sceneVersion}. Add a new version and release notes in docs/ray/releases.json before publishing.`,
  );
  return history.releases[0];
}
export function renderChangelog(history) {
  const text = [
    "# RAY changelog",
    "",
    "Product versions describe published milestones; scene/cache IDs identify the exact runtime assets. Version 26.0.0 introduces this maintained log and corresponds to the existing life-26 preview. Historical coverage begins with render-25.",
    "",
    "Future releases use MAJOR.MINOR.PATCH: breaking changes, enhancements, then fixes. Runtime changes require a new entry; documentation-only changes may keep the same scene/cache ID.",
    "",
  ];
  for (const release of history.releases) {
    text.push(
      `## [${release.version}](https://github.com/thakurakash-gg/thakurakash-gg/tree/ray-v${release.version}) — ${release.date}`,
      "",
      release.title,
      "",
      `- Scene/cache ID: \`${release.sceneVersion}\``,
      `- Preview label: \`${release.preview}\``,
      "",
    );
    for (const [heading, items] of Object.entries(release.changes))
      text.push(`### ${heading}`, "", ...items.map((item) => `- ${item}`), "");
    for (const [heading, key] of [
      ["Validation", "validation"],
      ["Known limits", "limitations"],
    ])
      if (release[key]?.length)
        text.push(`### ${heading}`, "", ...release[key].map((item) => `- ${item}`), "");
    if (release.commits?.length)
      text.push(
        "Commits: " +
          release.commits
            .map(
              (sha) => `[${sha}](https://github.com/thakurakash-gg/thakurakash-gg/commit/${sha})`,
            )
            .join(", ") +
          ".",
        "",
      );
  }
  return text.join("\n");
}
