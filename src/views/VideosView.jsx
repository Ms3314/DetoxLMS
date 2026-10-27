import { useEffect, useMemo, useState } from "react";
import { PLAYLISTS } from "../data/playlists";
import { useLocalStorage } from "../hooks/useLocalStorage";
import Player from "../components/Player";
import NotesPanel from "../components/NotesPanel";
import AllNotesModal from "../components/AllNotesModal";
import {
  formatSeconds,
  overallProgress,
  parseLength,
  percentDone,
  totalMinutes,
  totalSeconds,
} from "../lib/utils";

// Storage keys are unchanged from the original app so existing progress,
// notes and settings carry over.
const DEFAULT_KEY = "ytch-last-video"; // not used as watched store, used for resume
const WATCHED_KEY = "ytch-watched-v1";
const NOTES_KEY = "ytch-notes-v1";
const SETTINGS_KEY = "ytch-settings-v1";

const TOTAL_VIDEOS = PLAYLISTS.reduce((a, p) => a + p.videos.length, 0);

/** The YouTube section: playlists, embedded player, watch tracking and notes. */
export default function VideosView() {
  const [watched, setWatched] = useLocalStorage(WATCHED_KEY, {});
  const [notes, setNotes] = useLocalStorage(NOTES_KEY, {});
  const [settings, setSettings] = useLocalStorage(SETTINGS_KEY, {
    autoplay: true,
    autoMark: true,
  });

  const { autoplay, autoMark } = settings;
  const toggleSetting = (key) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  const [activePlaylistId, setActivePlaylistId] = useState(PLAYLISTS[0].id);
  const [currentVideoId, setCurrentVideoId] = useState(
    () => window.localStorage.getItem(DEFAULT_KEY) || PLAYLISTS[0].videos[0].id
  );
  const [query, setQuery] = useState("");
  const [showAllNotes, setShowAllNotes] = useState(false);

  const playlist =
    PLAYLISTS.find((p) => p.id === activePlaylistId) ?? PLAYLISTS[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return playlist.videos;
    return playlist.videos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        (v.channel && v.channel.toLowerCase().includes(q))
    );
  }, [playlist, query]);

  const currentIndex = playlist.videos.findIndex(
    (v) => v.id === currentVideoId
  );
  const currentVideo = playlist.videos[currentIndex] ?? playlist.videos[0];
  const doneCount = playlist.videos.filter((v) => watched[v.id]).length;
  const overall = overallProgress(PLAYLISTS, watched);
  const watchedAll = PLAYLISTS.reduce(
    (a, p) => a + p.videos.filter((v) => watched[v.id]).length,
    0
  );

  // Resume from where the user last was when switching playlists
  const selectVideo = (id) => {
    setCurrentVideoId(id);
    window.localStorage.setItem(DEFAULT_KEY, id);
  };

  const switchPlaylist = (id) => {
    setActivePlaylistId(id);
    const saved = window.localStorage.getItem(`${DEFAULT_KEY}#${id}`);
    const pl = PLAYLISTS.find((p) => p.id === id);
    if (saved && pl?.videos.some((v) => v.id === saved)) {
      setCurrentVideoId(saved);
    } else if (pl) {
      setCurrentVideoId(pl.videos[0].id);
    }
  };

  // remember last video per playlist
  useEffect(() => {
    window.localStorage.setItem(`${DEFAULT_KEY}#${activePlaylistId}`, currentVideoId);
  }, [activePlaylistId, currentVideoId]);

  const toggleWatched = (id) => {
    setWatched((w) => {
      const next = { ...w };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const addNote = (videoId, entry) => {
    setNotes((n) => ({
      ...n,
      [videoId]: [...(n[videoId] ?? []), entry],
    }));
  };

  const deleteNote = (videoId, ts) => {
    setNotes((n) => ({
      ...n,
      [videoId]: (n[videoId] ?? []).filter((e) => e.ts !== ts),
    }));
  };

  const goNext = () => {
    const idx = playlist.videos.findIndex((v) => v.id === currentVideoId);
    const next = playlist.videos[idx + 1];
    if (next) {
      selectVideo(next.id);
      return true;
    }
    return false;
  };

  const goPrev = () => {
    const idx = playlist.videos.findIndex((v) => v.id === currentVideoId);
    const prev = playlist.videos[idx - 1];
    if (prev) selectVideo(prev.id);
  };

  const handleEnded = () => {
    if (autoMark) setWatched((w) => ({ ...w, [currentVideoId]: true }));
    if (autoplay) goNext();
  };

  // keyboard navigation (not while typing)
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") {
        if (autoplay) return; // autoplay will advance; avoid double-skip
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, currentVideoId, playlist]);

  const exportAll = () => {
    const lines = [];
    for (const pl of PLAYLISTS) {
      lines.push(`=== ${pl.name} ===`);
      for (const v of pl.videos) {
        const entryList = notes?.[v.id] ?? [];
        if (entryList.length) {
          lines.push(`\n▶ ${v.title} (${v.length})\n`);
          for (const n of entryList) {
            lines.push(
              `  [${new Date(n.ts).toLocaleString()}] ${n.text}`
            );
          }
        }
      }
      lines.push("");
    }
    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "course-notes.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="view videos-view">
      <div className="stats-bar">
        <div className="stats-progress">
          <div className="progress-label">
            <span>
              {watchedAll}/{TOTAL_VIDEOS} watched
            </span>
            <span className="progress-pct">{overall}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${overall}%` }} />
          </div>
          <p className="stats-meta">
            {PLAYLISTS.length} playlists · {TOTAL_VIDEOS} videos · {totalMinutes(PLAYLISTS)} min
          </p>
        </div>

        <div className="stats-actions">
          <label className="toggle" title="After a video ends, move to the next one">
            <input
              type="checkbox"
              checked={autoplay}
              onChange={() => toggleSetting("autoplay")}
            />
            <span className="toggle-ui" />
            <span>Autoplay</span>
          </label>
          <label className="toggle" title="Automatically mark a video watched when it finishes">
            <input
              type="checkbox"
              checked={autoMark}
              onChange={() => toggleSetting("autoMark")}
            />
            <span className="toggle-ui" />
            <span>Auto-mark</span>
          </label>
          <button type="button" className="btn-ghost" onClick={() => setShowAllNotes(true)}>
            All notes
          </button>
          <button type="button" className="btn-ghost" onClick={exportAll}>
            Export
          </button>
        </div>
      </div>

      <main className="layout">
        {/* ── Sidebar ─────────────────────────────── */}
        <aside className="sidebar">
          <div className="playlist-sections">
            {["Courses", "Misc"].map((group) => {
              const pls = PLAYLISTS.filter(
                (p) => (p.group ?? "Courses") === group
              );
              if (!pls.length) return null;
              return (
                <div key={group} className="playlist-group">
                  <h3 className="playlist-group-label">{group}</h3>
                  <div className="playlist-tabs">
                    {pls.map((pl) => {
                      const pct = percentDone(pl, watched);
                      const isActive = pl.id === activePlaylistId;
                      return (
                        <button
                          key={pl.id}
                          type="button"
                          className={`playlist-card${isActive ? " active" : ""}${group === "Misc" ? " misc" : ""}`}
                          onClick={() => switchPlaylist(pl.id)}
                        >
                          {pl.videos[0] && (
                            <img
                              className="playlist-cover"
                              src={pl.videos[0].thumb}
                              alt=""
                              loading="lazy"
                            />
                          )}
                          <div className="playlist-card-body">
                            <span className="playlist-name">{pl.name}</span>
                            <span className="playlist-meta">
                              {pl.videos.filter((v) => watched[v.id]).length}/{pl.videos.length} · {formatSeconds(totalSeconds(pl))}
                            </span>
                            <div className="progress-track thin">
                              <div className="progress-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sidebar-head">
            <h2 className="sidebar-title">
              {playlist.name}
              <span className="badge-count">{doneCount}/{playlist.videos.length}</span>
            </h2>
            <input
              className="search-input"
              type="search"
              placeholder="Search videos…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <ul className="video-list">
            {filtered.map((v) => {
              const isCurrent = v.id === currentVideoId;
              const isWatched = Boolean(watched[v.id]);
              const position = playlist.videos.findIndex((x) => x.id === v.id);
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    className={`video-item${isCurrent ? " current" : ""}`}
                    onClick={() => selectVideo(v.id)}
                  >
                    <span className="video-thumb-wrap">
                      <img src={v.thumb} alt="" loading="lazy" className="video-thumb" />
                      <span className="video-len">{v.length}</span>
                      {isWatched && <span className="video-watched-badge">✓</span>}
                    </span>
                    <span className="video-text">
                      <span className="video-title" title={v.title}>
                        <span className="video-index">
                          {String(position + 1).padStart(2, "0")}
                        </span>
                        {playlist.lectureLabels
                          ? position === 0
                            ? "Intro"
                            : `Lecture ${position}`
                          : v.title}
                      </span>
                      <span className="video-channel">{v.channel || playlist.name}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`watch-toggle${isWatched ? " done" : ""}`}
                    aria-label={isWatched ? "Mark as unwatched" : "Mark as watched"}
                    title={isWatched ? "Mark as unwatched" : "Mark as watched"}
                    onClick={() => toggleWatched(v.id)}
                  >
                    {isWatched ? "✔" : "○"}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="video-item empty">No videos match "{query}".</li>
            )}
          </ul>
        </aside>

        {/* ── Main content ───────────────────────── */}
        <section className="content">
          {currentVideo ? (
            <div className="study">
              <div className="study-video">
              <div className="player-wrap">
                <Player
                  videoId={currentVideo.id}
                  onEnded={handleEnded}
                />
              </div>

              <div className="video-info">
                <div className="video-info-text">
                  <h2 className="video-info-title">{currentVideo.title}</h2>
                  <p className="video-info-meta">
                    <span className="chip">{playlist.name}</span>
                    {currentVideo.channel && (
                      <span className="chip">{currentVideo.channel}</span>
                    )}
                    <span className="chip">
                      ⏱ {currentVideo.length}{" "}
                      {parseLength(currentVideo.length) != null &&
                        `· ${formatSeconds(parseLength(currentVideo.length))}`}
                    </span>
                    {notes?.[currentVideo.id]?.length > 0 && (
                      <span className="chip accent-chip">
                        📝 {notes[currentVideo.id].length} note
                        {notes[currentVideo.id].length > 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>

                <div className="video-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    title="Previous video (←)"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    className={`btn-watch${watched[currentVideo.id] ? " watched" : ""}`}
                    onClick={() => toggleWatched(currentVideo.id)}
                  >
                    {watched[currentVideo.id]
                      ? "✔ Completed"
                      : "Mark as watched"}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => goNext()}
                    disabled={currentIndex === playlist.videos.length - 1}
                    title="Next video (→)"
                  >
                    Next →
                  </button>
                  <a
                    className="btn-ghost"
                    href={`https://www.youtube.com/watch?v=${currentVideo.id}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Open on YouTube"
                  >
                    ↗
                  </a>
                </div>
              </div>
              </div>

              <div className="study-notes">
              <NotesPanel
                videoId={currentVideo.id}
                title={currentVideo.title}
                notes={notes}
                onAdd={addNote}
                onDelete={deleteNote}
                onExport={exportAll}
              />
              </div>
            </div>
          ) : (
            <div className="content-empty">
              <h2>Select a video to start learning</h2>
            </div>
          )}
        </section>
      </main>

      {showAllNotes && (
        <AllNotesModal
          notes={notes}
          onClose={() => setShowAllNotes(false)}
          onJump={(plId, vid) => {
            switchPlaylist(plId);
            selectVideo(vid);
            setShowAllNotes(false);
          }}
        />
      )}
    </div>
  );
}
