import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { formatTimestamp, newId } from "../lib/workspace";

// Multiple blank pages, saved automatically to this browser.
const PAGES_KEY = "ytch-thoughts-pages-v1";
// The single-page key from before multi-page support; migrated on first load.
const LEGACY_PAGE_KEY = "ytch-thoughts-page-v1";

function makePage(seed = {}) {
  return { id: newId(), title: "", body: "", ts: Date.now(), ...seed };
}

function initialPages() {
  try {
    const legacy = JSON.parse(window.localStorage.getItem(LEGACY_PAGE_KEY) ?? "null");
    if (legacy && (legacy.title || legacy.body)) {
      return [makePage({ title: legacy.title ?? "", body: legacy.body ?? "" })];
    }
  } catch {
    /* ignore unreadable legacy data */
  }
  return [makePage()];
}

export default function ThoughtsView() {
  const [pages, setPages] = useLocalStorage(PAGES_KEY, initialPages);
  const [activeId, setActiveId] = useState(() => pages[0]?.id ?? null);

  const active = pages.find((p) => p.id === activeId) ?? pages[0] ?? null;
  const words = active?.body.trim() ? active.body.trim().split(/\s+/).length : 0;

  const updateActive = (patch) => {
    setPages((list) =>
      list.map((p) => (p.id === active.id ? { ...p, ...patch, ts: Date.now() } : p))
    );
  };

  const addPage = () => {
    const page = makePage();
    setPages((list) => [page, ...list]);
    setActiveId(page.id);
  };

  const deleteActive = () => {
    if (!active || !window.confirm("Delete this page?")) return;
    const remaining = pages.filter((p) => p.id !== active.id);
    setPages(remaining);
    setActiveId(remaining[0]?.id ?? null);
  };

  return (
    <div className="pages-view">
      <aside className="pages-list" aria-label="Pages">
        <button type="button" className="btn-accent btn-small pages-new" onClick={addPage}>
          + New page
        </button>
        <ul className="page-items">
          {pages.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`page-item${active?.id === p.id ? " active" : ""}`}
                onClick={() => setActiveId(p.id)}
              >
                <span className="page-item-title">{p.title || "Untitled"}</span>
                <span className="page-item-date">{formatTimestamp(p.ts)}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="page-view">
        {active ? (
          <>
            <article className="blank-page">
              <input
                className="page-title"
                type="text"
                placeholder="Sami Labs"
                aria-label="Page title"
                value={active.title}
                onChange={(e) => updateActive({ title: e.target.value })}
              />
              <textarea
                className="page-body"
                placeholder="Start writing…"
                aria-label="Page body"
                value={active.body}
                onChange={(e) => updateActive({ body: e.target.value })}
              />
            </article>
            <div className="page-foot">
              <p className="page-status">
                {words} {words === 1 ? "word" : "words"} · Saved on this device
              </p>
              <button type="button" className="btn-ghost btn-small danger" onClick={deleteActive}>
                Delete page
              </button>
            </div>
          </>
        ) : (
          <p className="empty-state">No pages yet. Create one to start writing.</p>
        )}
      </div>
    </div>
  );
}
