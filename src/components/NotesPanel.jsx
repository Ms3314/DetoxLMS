import { useState } from "react";

/**
 * Per-video notes. Notes are stored as a list of { ts, text } entries under
 * `notes[videoId]`, persisted to localStorage by the parent.
 */
export default function NotesPanel({ videoId, title, notes, onAdd, onDelete, onExport }) {
  const [draft, setDraft] = useState("");
  const entries = notes?.[videoId] ?? [];

  const handleAdd = () => {
    const text = draft.trim();
    if (!text) return;
    onAdd(videoId, { ts: Date.now(), text });
    setDraft("");
  };

  const handleKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <section className="notes-panel">
      <div className="notes-head">
        <div className="notes-title-row">
          <span className="notes-icon" aria-hidden="true">📝</span>
          <h3>Notes</h3>
          {entries.length > 0 && (
            <span className="badge-count">{entries.length}</span>
          )}
          <span
            className="notes-for"
            title={title}
          >
            {title}
          </span>
        </div>
        {entries.length > 0 && (
          <button type="button" className="btn-ghost btn-small" onClick={onExport}>
            Export
          </button>
        )}
      </div>

      {entries.length > 0 ? (
        <ul className="notes-list">
          {entries.map((n) => (
            <li key={n.ts} className="note-entry">
              <div className="note-meta">
                <span className="note-date">
                  {new Date(n.ts).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <button
                  type="button"
                  className="note-delete"
                  aria-label="Delete note"
                  onClick={() => onDelete(videoId, n.ts)}
                >
                  ✕
                </button>
              </div>
              <p className="note-text">{n.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="notes-empty">No notes yet for this video. Capture key points below.</p>
      )}

      <div className="notes-input-row">
        <textarea
          className="notes-input"
          rows={3}
          placeholder="Write a note for this video…  (⌘/Ctrl + Enter to save)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
        />
        <button
          type="button"
          className="btn-accent"
          onClick={handleAdd}
          disabled={!draft.trim()}
        >
          Save note
        </button>
      </div>
    </section>
  );
}