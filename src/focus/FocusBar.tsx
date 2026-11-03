import { useMemo, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { formatDuration } from "./format";
import { loadLog, todayCountedMs, totalCountedMs } from "./log";
import { lockLevel, type LockLevel } from "./presence";
import { TARGET_PRESETS_MIN } from "./rules";
import { rankFor } from "./stats";

const LENGTH_KEY = "ytch-focus-length-v1";

const LOCK_NOTES: Record<LockLevel, string> = {
  full: "Fullscreen with Esc captured. Hold Esc to exit; leaving is recorded.",
  fullscreen: "Fullscreen only: this browser can't capture Esc. Leaving is recorded.",
  none: "No fullscreen lock on this device. Leaving the tab is still recorded.",
};

type Length = number | "custom" | "open";

/**
 * Focus controls that sit above the Library: pick a length and start a locked
 * session on whatever video is currently selected. Start must be a click so
 * the browser allows fullscreen.
 */
export default function FocusBar({ onStart }: { onStart: (targetMs: number | null) => void }) {
  const [length, setLength] = useLocalStorage<Length>(LENGTH_KEY, 45);
  const [customMin, setCustomMin] = useState("30");

  const targetMs = useMemo(() => {
    if (length === "open") return null;
    if (length === "custom") {
      const minutes = Math.round(Number(customMin));
      return Number.isFinite(minutes) && minutes >= 1 ? Math.min(minutes, 480) * 60_000 : 0;
    }
    return length * 60_000;
  }, [length, customMin]);

  const [stats] = useState(() => {
    const log = loadLog();
    const total = totalCountedMs(log);
    return { today: todayCountedMs(log, Date.now()), total, rank: rankFor(total).current };
  });

  return (
    <form
      className="focus-bar"
      onSubmit={(e) => {
        e.preventDefault();
        if (targetMs !== 0) onStart(targetMs);
      }}
    >
      <span className="kicker focus-bar-label">Focus</span>

      <div className="filter-row" role="group" aria-label="Session length">
        {TARGET_PRESETS_MIN.map((m) => (
          <button
            key={m}
            type="button"
            className={`filter-chip${length === m ? " active" : ""}`}
            onClick={() => setLength(m)}
          >
            {m} min
          </button>
        ))}
        <button
          type="button"
          className={`filter-chip${length === "custom" ? " active" : ""}`}
          onClick={() => setLength("custom")}
        >
          Custom
        </button>
        <button
          type="button"
          className={`filter-chip${length === "open" ? " active" : ""}`}
          onClick={() => setLength("open")}
        >
          Open-ended
        </button>
      </div>

      {length === "custom" && (
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

      <button type="submit" className="btn-accent" disabled={targetMs === 0} title={LOCK_NOTES[lockLevel()]}>
        Start focus
      </button>

      <p className="focus-bar-stats">
        Today {formatDuration(stats.today)} · {(stats.total / 3_600_000).toFixed(1)}h total · {stats.rank.name}
      </p>
    </form>
  );
}
