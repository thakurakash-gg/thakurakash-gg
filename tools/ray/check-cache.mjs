import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const stores = new Map();
const cacheAPI = {
  async open(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const entries = stores.get(name);
    const key = (request) => (typeof request === "string" ? request : request.url);
    return {
      async match(request) {
        return entries.get(key(request))?.clone();
      },
      async put(request, response) {
        entries.set(key(request), response.clone());
      },
      async delete(request) {
        return entries.delete(key(request));
      },
      async keys() {
        return [...entries.keys()].map((url) => new Request(url));
      },
    };
  },
  async keys() {
    return [...stores.keys()];
  },
  async delete(name) {
    return stores.delete(name);
  },
};
const listeners = new Map();
let fetchCount = 0;
let networkBody = "building version A";
const networkOptions = [];
const hits = [];
const scope = "https://example.test/site/";
const context = {
  URL,
  Response,
  Uint8Array,
  crypto: crypto.webcrypto,
  caches: cacheAPI,
  fetch: async (request, options) => {
    fetchCount++;
    networkOptions.push(options);
    return new Response(networkBody);
  },
  self: {
    registration: { scope },
    location: new URL(scope),
    skipWaiting() {},
    clients: {
      claim: async () => {},
      get: async () => ({ postMessage: (data) => hits.push(data) }),
    },
    addEventListener: (name, callback) => listeners.set(name, callback),
  },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "ray-sw.js"), "utf8"), context);
const digest = (text) => crypto.createHash("sha256").update(text).digest("hex");
const asset = (body) => ({
  url: `assets/ray/models/site.glb?v=${digest(body)}`,
  sha256: digest(body),
  bytes: body.length,
});
async function request(url) {
  let result;
  listeners.get("fetch")({
    request: new Request(new URL(url, scope)),
    clientId: "test",
    respondWith: (promise) => {
      result = promise;
    },
  });
  return result;
}
async function message(type, data = {}) {
  let response;
  let pending;
  listeners.get("message")({
    data: { type, ...data },
    ports: [
      {
        postMessage: (value) => {
          response = value;
        },
      },
    ],
    waitUntil: (promise) => {
      pending = promise;
    },
  });
  await pending;
  return response;
}
const a = asset(networkBody);
assert.equal(await (await request(a.url)).text(), networkBody);
assert.equal(await (await request(a.url)).text(), networkBody);
assert.equal(fetchCount, 1, "A warm, unchanged asset must use the verified cache");
assert.equal(hits.length, 1);
assert.equal(
  (await request(asset("wrong content").url)).status,
  503,
  "Mixed deployment bytes must be rejected",
);
assert.equal(
  stores.get("ray-scene-content-v2").size,
  1,
  "Rejected bytes must not poison the cache",
);
await request("assets/ray/scene-manifest.json?check=1");
await request("assets/ray/scene-manifest.json?check=2");
assert.equal(networkOptions.at(-1).cache, "no-store", "The release check must bypass HTTP caches");
await cacheAPI.open("ray-scene-render-25-final");
let activation;
listeners.get("activate")({
  waitUntil: (promise) => {
    activation = promise;
  },
});
await activation;
assert(
  stores.has("ray-scene-render-25-final"),
  "Do not delete the working cache before the replacement finishes",
);
const release = (id, assets) => ({
  schema: 2,
  version: `scene-${id.repeat(16)}`,
  scripts: [],
  assets,
});
const versionA = release("a", [a]);
assert.equal(
  (await message("RAY_COMMIT_RELEASE", { manifest: versionA })).version,
  versionA.version,
);
assert(!stores.has("ray-scene-render-25-final"));
assert.equal((await message("RAY_SAVED_RELEASE")).manifest.version, versionA.version);
networkBody = "building version B";
const b = asset(networkBody);
assert.equal(
  await (await request(b.url)).text(),
  networkBody,
  "A changed building must load new bytes",
);
const versionB = release("b", [b]);
await message("RAY_COMMIT_RELEASE", { manifest: versionB });
assert.equal((await message("RAY_SAVED_RELEASE")).manifest.version, versionB.version);
assert.equal(stores.get("ray-scene-content-v2").size, 2, "Keep the previous completed release");
networkBody = "building version C";
const c = asset(networkBody);
await request(c.url);
await message("RAY_COMMIT_RELEASE", { manifest: release("c", [c]) });
assert.equal(
  stores.get("ray-scene-content-v2").size,
  2,
  "Prune versions older than the previous completed release",
);
assert.equal(await request("https://other.test/assets/ray/example.js"), undefined);
console.log(
  "Pass: fresh and warm cache, changed model, checksum rejection, network release checks, completed-release selection and safe cache cleanup.",
);
