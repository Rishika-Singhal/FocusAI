import { useState } from "react";
import { api } from "../api";
import type { AnalyzeResponse } from "../api";
import type { ActiveSession } from "../App";
import Heatmap from "./Heatmap";

const SIGNAL_LABELS: Record<string, string> = {
  chunk_similarity: "Best-passage similarity",
  embedding_similarity: "Whole-page similarity",
  keyword_coverage: "Key-term coverage",
  title_similarity: "Title similarity",
  llm_score: "AI reviewer score",
};

export default function Analyzer({ active }: { active: ActiveSession | null }) {
  const [topic, setTopic] = useState("");
  const [objectives, setObjectives] = useState("");
  const [mode, setMode] = useState<"text" | "url">("text");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const ready = (active || topic.trim()) && (mode === "url" ? url.trim() : text.trim());

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      const ex = await api.extractFile(file);
      if (ex.error) throw new Error(ex.error);
      setMode("text");
      setTitle(ex.title);
      setText(ex.cleaned_text);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function run() {
    setBusy(true);
    setError("");
    try {
      const ctx = active ? { session_id: active.sessionId } : { topic, learning_objectives: objectives };
      const body = mode === "url" ? { ...ctx, url: url.trim() } : { ...ctx, title, text };
      setResult(await api.analyze(body));
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <h2>Analyze content</h2>
        {active ? (
          <p className="muted">Checking against your active session: <strong>{active.topic}</strong></p>
        ) : (
          <>
            <p className="muted">No active session, so this is a one-off preview (nothing is saved).</p>
            <label>Study topic<input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Operating System Deadlocks" /></label>
            <label>Learning objectives<input value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="Understand Banker's algorithm" /></label>
          </>
        )}

        <div className="tabs small">
          <button className={mode === "text" ? "active" : ""} onClick={() => setMode("text")}>Paste text</button>
          <button className={mode === "url" ? "active" : ""} onClick={() => setMode("url")}>Web page / YouTube URL</button>
        </div>

        {mode === "url" ? (
          <label>URL<input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://en.wikipedia.org/wiki/Banker%27s_algorithm" /></label>
        ) : (
          <>
            <label>Title (optional)<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <label>Content<textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste an article, notes or transcript…" /></label>
            <label>…or upload a document (PDF, DOCX, TXT, MD)<input type="file" accept=".pdf,.docx,.txt,.md" onChange={(e) => onFile(e.target.files?.[0])} /></label>
          </>
        )}

        <button className="primary" disabled={!ready || busy} onClick={run}>{busy ? "Analyzing…" : "Analyze"}</button>
        {error && <p className="error">{error}</p>}
      </section>

      {result && (
        <section className="panel">
          <div className="result-head">
            <span className={`badge ${result.decision}`}>{result.decision}</span>
            <span className="big">{Math.round(result.relevance_score)}% relevant</span>
            <span className="muted">{result.classification.replace("_", " ").toLowerCase()}</span>
          </div>
          <div className="bar"><div className={`fill ${result.decision}`} style={{ width: `${result.relevance_score}%` }} /></div>
          <p>{result.explanation}</p>

          {result.matching_concepts.length > 0 && (
            <>
              <h3>Matching concepts</h3>
              <div className="chips">{result.matching_concepts.map((c) => <span key={c} className="chip">{c}</span>)}</div>
            </>
          )}

          <h3>Why this decision</h3>
          <ul>{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul>

          <h3>Signals</h3>
          <div className="signals">
            {Object.entries(SIGNAL_LABELS).map(([k, label]) => {
              const v = result.signals[k];
              return v == null ? null : (
                <div key={k}><span>{label}</span><div className="bar thin"><div className="fill neutral" style={{ width: `${v}%` }} /></div><b>{Math.round(v)}%</b></div>
              );
            })}
          </div>

          <h3>Relevance heatmap</h3>
          <Heatmap sentences={result.heatmap} method={result.explanation_method} />
          <p className="muted small">
            {result.title && <>“{result.title}” · </>}{result.word_count} words · {result.embedding_backend}{result.llm_used ? " + LLM" : ""}
          </p>
        </section>
      )}
    </div>
  );
}
