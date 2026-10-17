import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."),
  state = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "assets/studio/enquiry.js"), "utf8"), state);
const input = {
  name: "A & B",
  company: "Studio",
  email: "a@example.com",
  country: "India",
  phone: "+91 123",
  service: "RAY / NEXIV experience",
  message: "Line one\nLine two &bcc=someone@example.com",
};
const draft = state.window.StudioBrief.build(input);
assert(draft.startsWith("mailto:hr@kazeyami.com?subject="));
const query = new URLSearchParams(draft.split("?")[1]);
assert.equal(query.size, 2);
assert.equal(query.get("subject"), "Project enquiry — RAY / NEXIV experience");
assert(query.get("body").includes(input.message));
assert(query.get("body").includes("Name: A & B"));
assert.equal(query.get("bcc"), null);
assert.equal(draft.includes("\n"), false);
console.log(
  "Pass: enquiry preserves contact fields and multiline text, safely encoded in a reviewable email draft.",
);
