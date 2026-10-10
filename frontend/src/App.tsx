import { useEffect, useState } from "react";
import { api } from "./api";
import type { EngineInfo } from "./api";
import Analyzer from "./components/Analyzer";
import SessionSetup from "./components/SessionSetup";
import "./App.css";
export interface ActiveSession { sessionId: string; topic: string; objectives: string; keywords: string[] }

const STORAGE_KEY = "focusai_active_session";

function loadActive(): ActiveSession | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return parsed?.sessionId ? { objectives: "", keywords: [], ...parsed } : null;
  } catch {
    return null;
  }
}

function App() {
  const [tab, setTab] = useState<"session" | "analyze">("session");
  const [active, setActive] = useState<ActiveSession | null>(loadActive);
  const [backend, setBackend] = useState("Connecting to backend...");
  const [online, setOnline] = useState(false);
  const [engine, setEngine] = useState<EngineInfo | null>(null);

  useEffect(() => {
    api.health()
      .then((d) => { setBackend(`${d.service} is ${d.status}`); setOnline(true); return api.engine(); })
      .then(setEngine)
      .catch(() => { setBackend("Unable to connect to FocusAI backend"); setOnline(false); });
  }, []);

  // Keep the Chrome extension in sync with the active study session.
  useEffect(() => {
    if (active) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
      window.postMessage({ type: "FOCUSAI_SESSION", sessionId: active.sessionId, topic: active.topic }, window.location.origin);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      window.postMessage({ type: "FOCUSAI_SESSION_ENDED" }, window.location.origin);
    }
  }, [active]);

  return (
    <div className="app">
      <header>
        <h1>FocusAI</h1>
        <span className={`status ${online ? "up" : "down"}`}>{backend}</span>
      </header>
      {engine && (
        <p className="muted small">
          Embeddings: <code>{engine.embedding_backend}</code> · LLM reviewer: {engine.llm_enabled ? "on" : "off"} ·
          allow ≥ {engine.allow_threshold}%, warn ≥ {engine.warn_threshold}%
        </p>
      )}
      <nav className="tabs">
        <button className={tab === "session" ? "active" : ""} onClick={() => setTab("session")}>Study session</button>
        <button className={tab === "analyze" ? "active" : ""} onClick={() => setTab("analyze")}>Analyze content</button>
      </nav>
      {tab === "session" ? (
        <SessionSetup active={active} onStart={setActive} onEnd={() => setActive(null)} />
      ) : (
        <Analyzer active={active} />
      )}
    </div>
  );
}

export default App;
