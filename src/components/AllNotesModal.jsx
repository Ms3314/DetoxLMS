import { useEffect } from "react";
import { PLAYLISTS } from "../data/playlists";

/**
 * Modal showing every note across all videos, grouped by playlist.
 * Clicking a note jumps to that video.
 */
export default function AllNotesModal({ notes, onClose, onJump }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const totalNotes = Object.values(notes).reduce(
    (a, list) => a + (list?.length ?? 0),
    0
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>📚 All notes</h3>
          <span className="badge-count">{totalNotes} note{totalNotes !== 1 ? "s" : ""}</span>
          <button type="button" className="btn-ghost btn-small modal-close" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        <div className="modal-body">
          {totalNotes === 0 && (
            <p className="notes-empty">
              You haven't written any notes yet. Open a video and use the notes
              panel below the player.
            </p>
          )}
          {PLAYLISTS.map((pl) => {
            const withNotes = pl.videos.filter(
              (v) => (notes?.[v.id]?.length ?? 0) > 0
            );
            if (!withNotes.length) return null;
            return (
              <div key={pl.id} className="notes-group">
                <h4>{pl.name}</h4>
                {withNotes.map((v) => (
                  <div key={v.id} className="notes-group-video">
                    <button
                      type="button"
                      className="notes-group-title"
                      onClick={() => onJump(pl.id, v.id)}
                    >
                      ▶ {v.title}
                    </button>
                    <ul className="notes-list compact">
                      {notes[v.id].map((n) => (
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
                          </div>
                          <p className="note-text">{n.text}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}