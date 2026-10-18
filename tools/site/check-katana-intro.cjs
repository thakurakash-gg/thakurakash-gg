const assert = require("node:assert/strict");
const intro = require("../../assets/home/katana-intro.js");
assert(
  intro.duration < 1.5,
  "Assembly and landing remain brief and non-blocking",
);
assert(
  intro.pose(0).hiltX < 0 && intro.pose(0).steelX > 0,
  "Opposite entrances",
);
for (let t = 0.26; t <= intro.duration; t += 0.001) {
  const pose = intro.pose(t);
  assert(Math.abs(pose.hiltX) === 0);
  assert.equal(pose.steelX, 0);
  assert(Math.abs(pose.sheathRoll) === 0, "Cover must align before insertion");
  assert(pose.draw >= 0 && pose.draw <= 1);
}
for (let t = 0.72; t < 1.2; t += 0.001)
  assert.equal(intro.pose(t).draw, 0, "Fully inside the cover after the hit");
assert.equal(
  intro.pose(0.72).landing,
  0,
  "The katana closes before it starts moving down",
);
let previous = 0;
for (let t = 0.82; t <= 1.48; t += 0.01) {
  const pose = intro.pose(t);
  assert.equal(pose.draw, 0, "The sword stays sheathed during landing");
  assert(
    pose.landing >= previous && pose.landing <= 1,
    "Landing is smooth and one-way",
  );
  previous = pose.landing;
}
assert.equal(intro.pose(1.4).landing, 1);
assert.deepEqual(intro.pose(1.5), intro.pose(100), "Stable final pose");
console.log(
  "Intro: opposite entrances, assembly alignment before sheathing, closed-first movement and stable baseline landing pass.",
);
