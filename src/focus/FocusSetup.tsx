import { useMemo, useState } from "react";
import { PLAYLISTS } from "../data/playlists";
import { getLastVideo } from "../lib/playback";
import { formatDuration } from "./format";
import { loadLog, todayCountedMs, totalCountedMs } from "./log";
import { lockLevel, type LockLevel } from "./presence";
import { TARGET_PRESETS_MIN } from "./rules";
import { rankFor } from "./stats";

export interface StartParams {
  playlistId: string;
  videoId: string;
  targetMs: number | null;
}

const LOCK_NOTES: Record<LockLevel, string> = {
  full: "Fullscreen with Esc captured. Hold Esc to exit; leaving is recorded.",
  fullscreen: "Fullscreen only: this browser can't capture Esc. Leaving is recorded.",
  none: "No fullscreen lock on this device. Leaving the tab is still recorded.",
};

type Duration = number | "custom" | "open";

/** Pick what to study and for how long, then start. Starting must be a click: browsers need one for fullscreen. */
export default function FocusSetup({ onStart }: { onStart: (p: StartParams) => void }) {
  const [playlistId, setPlaylistId] = useState(PLAYLISTS[0].id);
  const playlist = PLAYLISTS.find((p) => p.id === playlistId) ?? PLAYLISTS[0];
  const [pickedVideo, setPickedVideo] = useState<string | null>(null);
  const [duration, setDuration] = useState<Duration>(45);
  const [customMin, setCustomMin] = useState("30");

  const savedVideo = getLastVideo(playlist.id);
  const videoId =
    [pickedVideo, savedVideo].find((id) => id && playlist.videos.some((v) => v.id === id)) ??
    playlist.videos[0].id;

  const targetMs = useMemo(() => {
    if (duration === "open") return null;
    if (duration === "custom") {
      const minutes = Math.round(Number(customMin));
      return Number.isFinite(minutes) && minutes >= 1 ? Math.min(minutes, 480) * 60_000 : 0;
    }
    return duration * 60_000;
  }, [duration, customMin]);

  const [stats] = useState(() => {
    const log = loadLog();
    const total = totalCountedMs(log);
    return { today: todayCountedMs(log, Date.now()), total, rank: rankFor(total) };
  });
  const { total, rank } = stats;
  const { current, next } = rank;

  return (
    <div className="view focus-setup">
      <div className="view-head">
        <div>
          <p className="kicker">Focus</p>
          <h2 className="view-title">Start a focus session</h2>
        </div>
      </div>

      <div className="focus-stats">
        <div className="focus-stat">
          <span className="focus-stat-value">{formatDuration(stats.today)}</span>
          <span className="focus-stat-label">Today</span>
        </div>
        <div className="focus-stat">
          <span className="focus-stat-value">{(total / 3_600_000).toFixed(1)}h</span>
          <span className="focus-stat-label">Total focus</span>
        </div>
        <div className="focus-stat">
          <span className="focus-stat-value">{current.name}</span>
          <span className="focus-stat-label">
            {next ? `Next: ${next.name} at ${next.hours}h` : "Top rank"}
          </span>
        </div>
      </div>

      <form
        className="focus-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (targetMs === 0) return;
          onStart({ playlistId: playlist.id, videoId, targetMs });
        }}
      >
        <label className="focus-field">
          <span className="kicker">Course</span>
          <select
            className="select"
            value={playlist.id}
            onChange={(e) => {
              setPlaylistId(e.target.value);
              setPickedVideo(null);
            }}
          >
            {PLAYLISTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="focus-field">
          <span className="kicker">Start from</span>
          <select className="select" value={videoId} onChange={(e) => setPickedVideo(e.target.value)}>
            {playlist.videos.map((v, i) => (
              <option key={v.id} value={v.id}>
                {String(i + 1).padStart(2, "0")} · {v.title}
              </option>
            ))}
          </select>
        </label>

        <div className="focus-field">
          <span className="kicker">Length</span>
          <div className="filter-row" role="group" aria-label="Session length">
            {TARGET_PRESETS_MIN.map((m) => (
              <button
                key={m}
                type="button"
                className={`filter-chip${duration === m ? " active" : ""}`}
                onClick={() => setDuration(m)}
              >
                {m} min
              </button>
            ))}
            <button
              type="button"
              className={`filter-chip${duration === "custom" ? " active" : ""}`}
              onClick={() => setDuration("custom")}
            >
              Custom
            </button>
            <button
              type="button"
              className={`filter-chip${duration === "open" ? " active" : ""}`}
              onClick={() => setDuration("open")}
            >
              Open-ended
            </button>
          </div>
          {duration === "custom" && (
            <input
              className="todo-input focus-custom"
              type="number"
              min={1}
              max={480}
              inputMode="numeric"
              aria-label="Custom minutes"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
            />
          )}
        </div>

        <p className="focus-note">{LOCK_NOTES[lockLevel()]}</p>
        <p className="focus-note">
          Leave for more than 10 seconds and the timer pauses. Three such absences, or two minutes away
          in total, end the session. Sessions under 10 focused minutes don't count.
        </p>

        <button type="submit" className="btn-accent focus-start" disabled={targetMs === 0}>
          Start focus
        </button>
      </form>
    </div>
  );
}
