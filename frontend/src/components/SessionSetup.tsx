import { useEffect, useState } from "react";
import { api } from "../api";
import type { HistoryItem, StudySession, User } from "../api";
import type { ActiveSession } from "../App";

interface Props {
  active: ActiveSession | null;
  onStart: (s: ActiveSession) => void;
  onEnd: () => void;
}

const fromSession = (s: StudySession): ActiveSession => ({
  sessionId: s.id,
  topic: s.study_context?.topic ?? s.title,
  objectives: s.study_context?.learning_objectives ?? "",
  keywords: s.study_context?.keywords ?? [],
});

export default function SessionSetup({ active, onStart, onEnd }: Props) {
  const [students, setStudents] = useState<User[]>([]);
  const [studentId, setStudentId] = useState("");
  const [recent, setRecent] = useState<StudySession[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [objectives, setObjectives] = useState("");
  const [material, setMaterial] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.students()
      .then((list) => { setStudents(list); setStudentId((cur) => cur || list[0]?.id || ""); })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!studentId) return;
    api.sessions(studentId).then(setRecent).catch(() => setRecent([]));
  }, [studentId, active]);

  const sessionId = active?.sessionId;
  const refreshHistory = () => { if (sessionId) api.history(sessionId).then(setHistory).catch(() => setHistory([])); };
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    api.history(sessionId).then((h) => { if (!cancelled) setHistory(h); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [sessionId]);

  async function createStudent() {
    setError("");
    try {
      const u = await api.createStudent(newEmail.trim(), newName.trim());
      setStudents((s) => [...s, u]);
      setStudentId(u.id);
      setNewName(""); setNewEmail("");
    } catch (e) { setError((e as Error).message); }
  }

  async function start() {
    setBusy(true); setError("");
    try {
      const created = await api.createSession({
        student_id: studentId, title: title.trim() || topic.trim(), topic: topic.trim(), learning_objectives: objectives.trim() || undefined,
      });
      let ctx = created.study_context;
      if (material) ctx = await api.uploadMaterial(created.id, material);
      onStart(fromSession({ ...created, study_context: ctx }));
      setTitle(""); setTopic(""); setObjectives(""); setMaterial(null);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function end() {
    if (!active) return;
    try { await api.endSession(active.sessionId); } catch (e) { setError((e as Error).message); return; }
    onEnd();
  }

  return (
    <div className="stack">
      {active && (
        <section className="panel highlight">
          <div className="result-head"><span className="badge ALLOW">ACTIVE</span><h2>{active.topic}</h2></div>
          {active.objectives && <p>{active.objectives}</p>}
          <h3>Key terms FocusAI is watching for</h3>
          <div className="chips">{active.keywords.map((k) => <span key={k} className="chip">{k}</span>)}</div>
          <p className="muted small">
            Session ID: <code>{active.sessionId}</code> — the Chrome extension picks this up automatically when it is installed.
          </p>
          <div className="row">
            <button onClick={refreshHistory}>Refresh decisions</button>
            <button className="danger" onClick={end}>End session</button>
          </div>
          {history.length > 0 && (
            <table>
              <thead><tr><th>Decision</th><th>Relevance</th><th>Page</th></tr></thead>
              <tbody>
                {history.slice(0, 10).map((h) => (
                  <tr key={h.id}>
                    <td><span className={`badge ${h.decision}`}>{h.decision}</span></td>
                    <td>{Math.round(h.relevance_score)}%</td>
                    <td className="ellipsis" title={h.url}>{h.title || h.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      <section className="panel">
        <h2>Start a study session</h2>
        {students.length === 0 ? (
          <>
            <p className="muted">No students yet. Create one (or run <code>uv run python scripts/seed_db.py</code>).</p>
            <label>Name<input value={newName} onChange={(e) => setNewName(e.target.value)} /></label>
            <label>Email<input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></label>
            <button disabled={!newName.trim() || !newEmail.trim()} onClick={createStudent}>Create student</button>
          </>
        ) : (
          <>
            <label>Student
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
              </select>
            </label>
            <label>Study topic *<input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Operating System Deadlocks" /></label>
            <label>Learning objectives<textarea rows={3} value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="Understand Banker's algorithm and the Coffman conditions" /></label>
            <label>Session title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="(defaults to the topic)" /></label>
            <label>Course material (optional: PDF, DOCX, TXT, MD)<input type="file" accept=".pdf,.docx,.txt,.md" onChange={(e) => setMaterial(e.target.files?.[0] ?? null)} /></label>
            <button className="primary" disabled={!topic.trim() || !studentId || busy} onClick={start}>{busy ? "Starting…" : "Start session"}</button>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </section>

      {recent.filter((s) => s.id !== active?.sessionId).length > 0 && (
        <section className="panel">
          <h2>Recent sessions</h2>
          <ul className="plain">
            {recent.filter((s) => s.id !== active?.sessionId).slice(0, 6).map((s) => (
              <li key={s.id}>
                <span><strong>{s.title}</strong> <span className="muted">· {s.status}</span></span>
                <button onClick={() => onStart(fromSession(s))}>Resume</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
