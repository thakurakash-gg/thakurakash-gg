const assert = require("node:assert/strict");
const create = require("../../assets/home/katana-flight.js");
const step = (flight, props, count = 1) => {
  let pose;
  for (let i = 0; i < count; i++)
    pose = flight.update(1 / 60, {
      draw: 1,
      target: 1,
      dragging: false,
      assembling: false,
      reduced: false,
      ...props,
    });
  return pose;
};
const flight = create();
assert.equal(
  step(flight, { assembling: true }, 120).progress,
  0,
  "Opening assembly cannot trigger docking",
);
assert.equal(
  step(flight, { dragging: true }, 120).progress,
  0,
  "A held drag stays under user control",
);
assert.equal(
  step(flight, { draw: 0.5 }, 120).progress,
  0,
  "Blade must clear the scabbard first",
);
const half = step(flight, {}, 63);
assert(half.progress > 0.49 && half.progress < 0.51);
assert(half.sheath > 0 && half.hilt === 0, "Only the cover dissolves");
const end = step(flight, {}, 65);
assert.equal(end.progress, 1);
assert.equal(end.hilt, 0, "Handle stays attached");
assert.equal(end.sheath, 1);
assert.equal(end.moving, false, "Docked scene has no idle animation loop");
assert.equal(
  step(flight, { target: 0, draw: 1 }, 128).progress,
  0,
  "Sheathing restores the starting pose",
);
assert.equal(
  step(create(), { reduced: true }).progress,
  1,
  "Reduced motion skips the flight",
);
console.log(
  "Katana flight: staged draw, touch hold, smooth docking, dissolution, reversal and reduced motion pass.",
);

const still = create();
step(still, { reduced: true });
assert.equal(
  step(still, { reduced: true, target: 0, draw: 0 }).progress,
  0,
  "Reduced motion also skips the return flight",
);

const reverse = create();
step(reverse, {}, 128);
const halfwayBack = step(reverse, { target: 0 }, 63);
assert(
  Math.abs(halfwayBack.progress - half.progress) < 1e-8,
  "Return follows the same 2.1-second path in reverse",
);
assert.equal(halfwayBack.hilt, 0);
