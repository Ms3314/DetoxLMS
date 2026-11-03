import { Link } from "react-router-dom";
import { PLAYLISTS } from "../data/playlists";
import type { FocusSession } from "./engine";
import { formatDuration } from "./format";
import { loadLog, todayCountedMs, totalCountedMs, type ActiveSession, type SessionRecord } from "./log";
import { MIN_COUNTED_MS } from "./rules";
import { countedMs, countsForStreak, rankFor } from "./stats";

const HEADLINES: Record<FocusSession["status"], string> = {
  completed: "Session complete",
  failed: "Session failed: you left too often",
  abandoned: "Session ended early",
  focusing: "",
  away: "",
};

interface Props {
  active: ActiveSession;
  record: SessionRecord | null;
  onDone: () => void;
}

/** Shown after a session ends. Not locked: fullscreen has already been released. */
export default function FocusSummary({ active, record, onDone }: Props) {
  const s = active.session;
  const playlist = PLAYLISTS.find((p) => p.id === active.playlistId);
  const log = loadLog();
  const total = totalCountedMs(log);
  const { current } = rankFor(total);
  const wanted = countedMs(s);
  const counted = record?.countedMs ?? wanted;

  let hoursLine: string;
  if (wanted === 0) hoursLine = `Under ${MIN_COUNTED_MS / 60_000} minutes, so it doesn't count toward your hours.`;
  else if (counted < wanted) hoursLine = `${formatDuration(counted)} counted (daily limit reached).`;
  else hoursLine = `${formatDuration(counted)} added to your hours.`;

  return (
    <div className="view focus-summary">
      <div className="view-head">
        <div>
          <p className="kicker">{playlist?.name ?? "Focus"}</p>
          <h2 className="view-title">{HEADLINES[s.status]}</h2>
        </div>
      </div>

      <div className="focus-stats">
        <div className="focus-stat">
          <span className="focus-stat-value">{formatDuration(s.focusedMs)}</span>
          <span className="focus-stat-label">Focused</span>
        </div>
        <div className="focus-stat">
          <span className="focus-stat-value">{formatDuration(s.awayMs)}</span>
          <span className="focus-stat-label">Away</span>
        </div>
        <div className="focus-stat">
          <span className="focus-stat-value">{s.strikes}</span>
          <span className="focus-stat-label">Strikes</span>
        </div>
      </div>

      <ul className="focus-summary-list">
        <li>{hoursLine}</li>
        <li>
          {countsForStreak(s)
            ? "This session keeps your streak going."
            : "This session doesn't count toward your streak."}
        </li>
        <li>
          Today {formatDuration(todayCountedMs(log, s.endedAt ?? s.lastAt))} · Total {(total / 3_600_000).toFixed(1)}h ·{" "}
          {current.name}
        </li>
      </ul>

      <div className="focus-dialog-actions">
        <button type="button" className="btn-accent" onClick={onDone}>
          Back to start
        </button>
        <Link className="btn-ghost" to="/library" onClick={onDone}>
          Open library
        </Link>
      </div>
    </div>
  );
}
