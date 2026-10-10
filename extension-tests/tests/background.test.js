// background.js: fail-open behaviour. Run with: npm install && npm test
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const CODE = fs.readFileSync(path.join(__dirname, "../../extension/background.js"), "utf8");
const GOOD = { decision: "BLOCK", relevance_score: 4, explanation: "x", reasons: [], matching_concepts: [], heatmap: [] };

function load({ fetchImpl, badgeImpl, config = { enabled: true, sessionId: "S1", backendUrl: "http://b" } } = {}) {
  const store = { local: { ...config }, session: {} };
  const badges = [];
  let listener;
  const chrome = {
    storage: {
      local: { get: async (d) => ({ ...d, ...store.local }), set: async (o) => Object.assign(store.local, o) },
      session: {
        get: async (k) => (typeof k === "string" ? { [k]: store.session[k] } : {}),
        set: async (o) => Object.assign(store.session, o),
        remove: async (k) => delete store.session[k],
      },
    },
    action: {
      setBadgeText: async (a) => { badges.push(a); if (badgeImpl) return badgeImpl(a); },
      setBadgeBackgroundColor: async () => {},
    },
    runtime: { onMessage: { addListener: (fn) => { listener = fn; } } },
    tabs: { onRemoved: { addListener: () => {} } },
  };
  const calls = [];
  const fetch = async (url, init) => { calls.push({ url, body: init && init.body && JSON.parse(init.body) }); return fetchImpl(url, init); };
  vm.runInNewContext(CODE, { chrome, fetch, setTimeout, clearTimeout, AbortController, Date, JSON, Promise, Object, String, Number, Math, Error });
  const send = (msg, tabId = 7) => new Promise((resolve) => { listener(msg, { tab: tabId == null ? undefined : { id: tabId } }, resolve); });
  return { send, calls, badges, store };
}
const ok = (body) => async () => ({ ok: true, status: 200, json: async () => body });
const payload = { url: "https://www.youtube.com/watch?v=a", title: "T", text: "", metadata: { video_id: "a", description: "d", channel: "c", keywords: ["k"] } };

test("backend unavailable -> {error}, never throws (fail open)", async () => {
  const { send, badges } = load({ fetchImpl: async () => { throw new TypeError("Failed to fetch"); } });
  const res = await send({ type: "ANALYZE_PAGE", payload });
  assert.ok(res.error && !res.result);
  assert.equal(badges.at(-1).text, ""); // neutral badge
});

test("backend 500 -> {error}", async () => {
  const { send } = load({ fetchImpl: async () => ({ ok: false, status: 500, json: async () => ({}) }) });
  assert.match((await send({ type: "ANALYZE_PAGE", payload })).error, /500/);
});

test("malformed JSON from backend -> {error}", async () => {
  const { send } = load({ fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError("bad"); } }) });
  assert.ok((await send({ type: "ANALYZE_PAGE", payload })).error);
});

test("closed tab ('No tab with id') does not break analysis", async () => {
  const { send } = load({ fetchImpl: ok(GOOD), badgeImpl: async () => { throw new Error("No tab with id: 7"); } });
  const res = await send({ type: "ANALYZE_PAGE", payload });
  assert.equal(res.result.decision, "BLOCK");
});

test("missing sender tab does not break analysis", async () => {
  const { send } = load({ fetchImpl: ok(GOOD) });
  assert.equal((await send({ type: "ANALYZE_PAGE", payload }, null)).result.decision, "BLOCK");
});

test("forwards YouTube metadata and caches the decision", async () => {
  const { send, calls } = load({ fetchImpl: ok(GOOD) });
  await send({ type: "ANALYZE_PAGE", payload });
  const second = await send({ type: "ANALYZE_PAGE", payload });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].body.metadata, payload.metadata);
  assert.equal(calls[0].body.session_id, "S1");
  assert.equal(second.cached, true);
});

test("disabled or no session -> skipped without network", async () => {
  const a = load({ fetchImpl: ok(GOOD), config: { enabled: false, sessionId: "S1" } });
  assert.equal((await a.send({ type: "ANALYZE_PAGE", payload })).skipped, "disabled");
  const b = load({ fetchImpl: ok(GOOD), config: { enabled: true, sessionId: "" } });
  assert.equal((await b.send({ type: "ANALYZE_PAGE", payload })).skipped, "no_session");
  assert.equal(a.calls.length + b.calls.length, 0);
});

test("override survives a failing backend", async () => {
  const { send, store } = load({ fetchImpl: async () => { throw new Error("down"); } });
  assert.deepEqual(await send({ type: "OVERRIDE", payload: { url: "https://x" } }), { ok: true });
  assert.ok(store.session.overrides["https://x"] > Date.now());
});
