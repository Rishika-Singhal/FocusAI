// FocusAI service worker: talks to the FastAPI backend on behalf of content scripts.
const DEFAULTS = { backendUrl: "http://127.0.0.1:8000", enabled: true, sessionId: "", topic: "" };
const CACHE_TTL_MS = 10 * 60 * 1000;
const OVERRIDE_TTL_MS = 15 * 60 * 1000;
const MAX_TEXT_CHARS = 30000;

const getConfig = () => chrome.storage.local.get(DEFAULTS);
const sessionGet = async (key) => (await chrome.storage.session.get(key))[key];

async function setBadge(tabId, decision) {
  if (tabId == null) return;

  const map = {
    ALLOW: ["✓", "#16a34a"],
    WARN: ["!", "#d97706"],
    BLOCK: ["×", "#dc2626"]
  };

  const [text, color] = map[decision] || ["", "#64748b"];

  try {
    await chrome.action.setBadgeText({ tabId, text });
    await chrome.action.setBadgeBackgroundColor({ tabId, color });
  } catch (_) {
    // Tab may have been closed or navigated away while analysis was running.
    // Never let a badge failure break page analysis.
  }
}

const ANALYZE_TIMEOUT_MS = 35000; // backend may fetch a YouTube transcript and call the LLM
const MAX_CACHE_ENTRIES = 150;

// Prune stale/oversized cache so chrome.storage.session never hits its quota.
function pruneCache(cache) {
  const now = Date.now();
  const entries = Object.entries(cache).filter(([, v]) => now - v.at < CACHE_TTL_MS);
  entries.sort((a, b) => b[1].at - a[1].at);
  return Object.fromEntries(entries.slice(0, MAX_CACHE_ENTRIES));
}

// Every failure path returns {error} (never throws): the content script then leaves the page alone.
async function analyze(payload, tabId) {
  try {
    const cfg = await getConfig();
    if (!cfg.enabled) return { skipped: "disabled" };
    if (!cfg.sessionId) return { skipped: "no_session" };

    const overrides = (await sessionGet("overrides")) || {};
    if (overrides[payload.url] && overrides[payload.url] > Date.now()) return { skipped: "override" };

    const cacheKey = `${cfg.sessionId}|${payload.url}`;
    let cache = (await sessionGet("cache")) || {};
    const hit = cache[cacheKey];
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      await setBadge(tabId, hit.result.decision);
      return { result: hit.result, cached: true };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);
    let result;
    try {
      const resp = await fetch(`${cfg.backendUrl}/api/relevance/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          session_id: cfg.sessionId,
          url: payload.url,
          title: payload.title,
          text: (payload.text || "").slice(0, MAX_TEXT_CHARS),
          metadata: payload.metadata || undefined, // YouTube: description, channel, hashtags
        }),
      });
      if (!resp.ok) throw new Error(`Backend returned ${resp.status}`);
      result = await resp.json();
    } finally {
      clearTimeout(timer);
    }

    // Storing state is best-effort: a closed tab or full storage must not turn a good result into an error.
    try {
      cache = pruneCache(cache);
      cache[cacheKey] = { at: Date.now(), result };
      const update = { cache };
      if (tabId != null) update[`tab:${tabId}`] = { url: payload.url, result };
      await chrome.storage.session.set(update);
    } catch (_) { /* ignore */ }
    await setBadge(tabId, result.decision);
    return { result };
  } catch (err) {
    // Fail open: never break browsing because the backend is down, slow or returned an error.
    await setBadge(tabId, null);
    return { error: String((err && err.message) || err) };
  }
}

async function override(payload) {
  const cfg = await getConfig();
  try {
    const overrides = (await sessionGet("overrides")) || {};
    overrides[payload.url] = Date.now() + OVERRIDE_TTL_MS;
    await chrome.storage.session.set({ overrides });
  } catch (_) { /* the page is still released; only the 15-minute memory is lost */ }
  try {
    await fetch(`${cfg.backendUrl}/api/relevance/override`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: cfg.sessionId, url: payload.url, title: payload.title }),
    });
  } catch (_) { /* logging is best-effort */ }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = sender.tab ? sender.tab.id : null;
  switch (msg.type) {
    case "ANALYZE_PAGE":
      analyze(msg.payload, tabId).then(sendResponse, (e) => sendResponse({ error: String(e) }));
      return true;
    case "OVERRIDE":
      override(msg.payload).then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
      return true;
    case "SET_SESSION":
      chrome.storage.local
        .set({ sessionId: msg.sessionId || "", topic: msg.topic || "" })
        .then(() => chrome.storage.session.set({ cache: {}, overrides: {} }))
        .then(() => sendResponse({ ok: true }));
      return true;
    case "GET_TAB_STATE":
      sessionGet(`tab:${msg.tabId}`).then((state) => sendResponse(state || null));
      return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => { chrome.storage.session.remove(`tab:${tabId}`).catch(() => {}); });
