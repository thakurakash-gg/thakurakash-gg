import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const home = await readFile(new URL("../../index.html", import.meta.url), "utf8");
const people = [
  ["Siya Baranwal", "UI/UX Artist"],
  ["Pragati Saxena", "HR"],
  ["DK", "Developer"],
  ["Deepraj", "Senior Developer"],
  ["Shayan Ansari", "Technical Artist"],
  ["Akash Singh", "3D Artist"],
  ["Hammer", "Unreal Artist"],
];
const team = home.match(/<section\b[^>]*\bid="team"[^>]*>[\s\S]*?<\/section>/)?.[0];
assert(team, "The home page must expose its team section");
assert(team.includes('aria-labelledby="team-heading"'), "The section needs its visible heading");
assert(team.includes('id="team-heading"'), "The team heading must exist");
assert(/<ul\b[^>]*class="people-roster"[^>]*>/.test(team), "The people directory should be a semantic list");
const profiles = [...team.matchAll(/<li\b[^>]*class="people-member"[^>]*>([\s\S]*?)<\/li>/g)].map(match => match[1]);
assert.equal(profiles.length, people.length, "The directory must include all seven approved people");
for (const [index, [name, role]] of people.entries()) {
  const profile = profiles[index];
  assert.equal(profile.match(/<h3>([^<]+)<\/h3>/)?.[1], name, "Approved names must remain visible in the roster");
  assert.equal(profile.match(/<p class="people-role">([^<]+)<\/p>/)?.[1], role, "Approved roles must remain visible in the roster");
  const description = profile.match(/<p class="people-description">([^<]+)<\/p>/)?.[1];
  assert(description && description.length > 30, name + " needs a useful responsibility description in the initial HTML");
}
assert(!/<button\b|\bhidden\b|\binert\b|aria-hidden="true"/.test(team), "Profiles must be readable without a selection or JavaScript");
assert(!/team-cast|data-character|data-crew-image|kazeyami-crew|Original illustrated identities/.test(team), "Team art and character-selection markup must be removed");
assert(!/assets\/home\/team\.(?:js|css)/.test(home), "The retired anime implementation must not load");
assert(home.includes('href="assets/team/professional-team.css'), "The professional directory style must load");
await readFile(new URL("../../assets/team/professional-team.css", import.meta.url), "utf8");
console.log("Team: seven approved names, roles and responsibility descriptions are present in a semantic directory without JavaScript or anime dependencies.");
