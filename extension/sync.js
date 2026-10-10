// Runs on the FocusAI web app (localhost:5173): passes the active study session to the extension.
(() => {
  const send = (sessionId, topic) => {
    try { chrome.runtime.sendMessage({ type: "SET_SESSION", sessionId, topic }); } catch (_) { /* extension reloaded */ }
  };
  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data) return;
    if (e.data.type === "FOCUSAI_SESSION") send(e.data.sessionId, e.data.topic);
    if (e.data.type === "FOCUSAI_SESSION_ENDED") send("", "");
  });
  try {
    const saved = JSON.parse(localStorage.getItem("focusai_active_session") || "null");
    if (saved && saved.sessionId) send(saved.sessionId, saved.topic);
  } catch (_) { /* ignore */ }
})();
