import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../../assets/home/team.js", import.meta.url), "utf8");
const people = [
  ["Siya Baranwal", "UI/UX Artist"],
  ["Pragati Saxena", "HR"],
  ["DK", "Developer"],
  ["Deepraj", "Senior Developer"],
  ["Shayan Ansari", "Technical Artist"],
  ["Akash Singh", "3D Artist"],
  ["Hammer", "Unreal Artist"],
];

function mount({ intersectionObserver = true, sectionPresent = true, crewImage = "assets/team/kazeyami-crew-v4.webp?v=test" } = {}) {
  let focused = -1;
  const element = () => ({
    dataset: {}, attributes: {}, textContent: "", listeners: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, listener) { this.listeners[name] = listener; },
  });
  const buttons = people.map((person, index) => Object.assign(element(), {
    attributes: { "aria-pressed": String(index === 0) },
    focus() { focused = index; },
  }));
  const fields = Object.fromEntries(["name", "role", "description"].map(key => [key, element()]));
  const properties = {};
  const classes = new Set();
  const section = {
    dataset: crewImage ? { crewImage } : {},
    style: { setProperty(key, value) { properties[key] = value; } },
    classList: { add(value) { classes.add(value); } },
    querySelectorAll() { return buttons; },
    querySelector(selector) {
      return fields[selector.match(/data-cast-(\w+)/)?.[1]] || null;
    },
  };
  const images = [];
  const observers = [];
  class Image {
    constructor() { images.push(this); }
  }
  class IntersectionObserver {
    constructor(callback, options) { this.callback = callback; this.options = options; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  }
  const window = intersectionObserver ? { IntersectionObserver } : {};
  vm.runInNewContext(source, {
    document: { querySelector: () => sectionPresent ? section : null },
    Image, IntersectionObserver, window,
  });
  const click = index => buttons[index].listeners.click();
  const key = (index, value) => {
    let prevented = false;
    buttons[index].listeners.keydown({ key: value, preventDefault() { prevented = true; } });
    return prevented;
  };
  function selected(index) {
    const [name, role] = people[index];
    assert.equal(fields.name.textContent, name);
    assert.equal(fields.role.textContent, role);
    assert(fields.description.textContent.length > 20, "Selection should include a useful role description");
    assert.deepEqual(buttons.map(button => button.attributes["aria-pressed"]), people.map((person, i) => String(i === index)));
  }
  return { images, observers, properties, classes, click, key, selected, focused: () => focused };
}

const team = mount();
assert.equal(team.images.length, 0, "Offscreen team art must not load with the hero");
assert.equal(team.observers.length, 1);
const observer = team.observers[0];
observer.callback([{ isIntersecting: false }]);
assert.equal(team.images.length, 0);
observer.callback([{ isIntersecting: true }]);
assert.equal(team.images.length, 1);
assert(observer.disconnected, "Stop observing once the art has been requested");
assert.equal(team.images[0].decoding, "async");
assert.equal(team.images[0].src, "assets/team/kazeyami-crew-v4.webp?v=test");
assert(!team.classes.has("is-art-ready"), "Do not reveal an image before it is ready");
team.images[0].onload();
assert(team.classes.has("is-art-ready"));
assert.equal(team.properties["--crew-art"], 'url("assets/team/kazeyami-crew-v4.webp?v=test")');
observer.callback([{ isIntersecting: true }]);
assert.equal(team.images.length, 1, "Roster portraits must share one image request");

people.forEach((person, index) => { team.click(index); team.selected(index); });
for (const [from, value, to] of [[6,"ArrowRight",0],[0,"ArrowLeft",6],[3,"Home",0],[2,"End",6],[1,"ArrowRight",2],[1,"ArrowLeft",0]]) {
  assert(team.key(from, value), `${value} should handle its navigation event`);
  assert.equal(team.focused(), to, "Keyboard selection must move focus with the displayed teammate");
  team.selected(to);
}
assert(!team.key(0, "Tab"), "Normal tab navigation must remain available");
assert.equal(mount({ intersectionObserver: false }).images.length, 1, "Older browsers should still receive the roster art");
assert.equal(mount({ sectionPresent: false }).images.length, 0, "Pages without a team roster should remain unaffected");

const failedArt = mount({ intersectionObserver: false });
failedArt.images[0].onerror();
assert(failedArt.classes.has("is-art-unavailable"), "Failed atlas requests should expose the unavailable-art state");
assert(!failedArt.classes.has("is-art-ready"), "Failed art must not be marked ready");
failedArt.click(6);
failedArt.selected(6);
assert.equal(failedArt.images.length, 1, "A failed atlas must not cause repeated downloads on selection");

const missingArt = mount({ crewImage: null });
missingArt.observers[0].callback([{ isIntersecting: true }]);
assert.equal(missingArt.images.length, 0, "Missing atlas URLs must not make broken image requests");
missingArt.click(2);
missingArt.selected(2);
console.log("Team: seven crew selections, accessible states, keyboard navigation, one lazy atlas and missing/failed-art fallbacks verified.");
