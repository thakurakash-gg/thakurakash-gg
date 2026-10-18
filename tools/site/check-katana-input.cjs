const assert = require("node:assert/strict");
const create = require("../../assets/home/katana-interaction.js");
const input = create();
assert.equal(input.target(), 0);
input.toggle();
assert.equal(input.target(), 1);
input.toggle();
assert.equal(input.target(), 0, "Rapid reversal uses intended target");
input.scroll(0.3);
assert.equal(input.target(), 0.66, "Scrolling releases manual override");
input.down({ id: 1, x: 100, y: 100, type: "mouse", draw: 0.66 });
input.move({ id: 1, x: 102, y: 100, width: 1000 });
input.cancel();
input.scroll(0.4);
assert(
  Math.abs(input.target() - 0.88) < 1e-10,
  "Incidental mouse movement cannot pin the blade closed",
);
input.down({ id: 2, x: 100, y: 100, type: "touch", draw: 0.88 });
input.move({ id: 2, x: 101, y: 180, width: 390 });
input.up({ id: 2, x: 101, y: 180 });
assert(
  Math.abs(input.target() - 0.88) < 1e-10,
  "Touch scrolling does not toggle the blade",
);
input.down({ id: 3, x: 100, y: 100, type: "touch", draw: 0.88 });
input.up({ id: 3, x: 100, y: 100 });
assert.equal(input.target(), 0, "A tap sheathes an open blade");
input.down({ id: 4, x: 100, y: 100, type: "mouse", draw: 0 });
input.move({ id: 4, x: 500, y: 100, width: 800 });
input.up({ id: 4, x: 500, y: 100 });
assert.equal(input.target(), 1, "A deliberate drag extracts the blade");
console.log(
  "Katana: rapid toggles, incidental movement, scroll recovery, touch tap/pan and drag pass.",
);

input.down({ id: 5, x: 50, y: 100, type: "touch", draw: 0 });
assert(
  input.move({ id: 5, x: 155, y: 103, width: 390 }),
  "Horizontal touch captures a draw",
);
assert(input.isDragging());
input.up({ id: 5, x: 155, y: 103 });
assert.equal(
  input.target(),
  1,
  "A released horizontal swipe completes the draw",
);
assert.equal(input.isDragging(), false);
input.toggle();
input.down({ id: 6, x: 50, y: 100, type: "touch", draw: 0 });
input.move({ id: 6, x: 52, y: 130, width: 390 });
assert.equal(
  input.move({ id: 6, x: 150, y: 145, width: 390 }),
  false,
  "A vertical gesture stays a page scroll",
);
input.up({ id: 6, x: 150, y: 145 });
assert.equal(input.target(), 0);
