import { useState } from "react";
import { makePage, usePages } from "../hooks/usePages";

/**
 * Notepad beside the video. Reads and writes the same pages as the Sami Labs
 * section, so anything written here shows up there and the other way round.
 */
export default function Notepad() {
  const [pages, setPages] = usePages();
  const [pickedId, setPickedId] = useState(null);

  const page = pages.find((p) => p.id === pickedId) ?? pages[0] ?? null;
  const words = page?.body.trim() ? page.body.trim().split(/\s+/).length : 0;

  const updatePage = (patch) => {
    setPages((list) =>
      list.map((p) => (p.id === page.id ? { ...p, ...patch, ts: Date.now() } : p))
    );
  };

  const addPage = () => {
    const created = makePage();
    setPages((list) => [created, ...list]);
    setPickedId(created.id);
  };

  return (
    <section className="notepad" aria-label="Notepad">
      <div className="notepad-head">
        {page ? (
          <select
            className="select"
            aria-label="Page"
            value={page.id}
            onChange={(e) => setPickedId(e.target.value)}
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || "Untitled"}
              </option>
            ))}
          </select>
        ) : (
          <span className="kicker">Notepad</span>
        )}
        <button type="button" className="btn-ghost btn-small" onClick={addPage}>
          + New
        </button>
      </div>

      {page ? (
        <>
          <input
            className="notepad-title"
            type="text"
            placeholder="Sami Labs"
            aria-label="Notepad title"
            value={page.title}
            onChange={(e) => updatePage({ title: e.target.value })}
          />
          <textarea
            className="notepad-body"
            placeholder="Write while you watch…"
            aria-label="Notepad body"
            value={page.body}
            onChange={(e) => updatePage({ body: e.target.value })}
          />
          <p className="page-status">
            {words} {words === 1 ? "word" : "words"} · Synced with Sami Labs
          </p>
        </>
      ) : (
        <p className="notepad-empty">No pages yet. Create one to start writing.</p>
      )}
    </section>
  );
}
