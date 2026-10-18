const assert = require("node:assert/strict");
const intro = require("../../assets/home/katana-intro.js");
assert(intro.duration < 1, "The intro must not add a long wait");
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
assert.deepEqual(intro.pose(1), intro.pose(100), "Stable final pose");
console.log(
  "Intro: opposite entrances, assembly alignment before sheathing, subsecond timing and stable landing pass.",
);
