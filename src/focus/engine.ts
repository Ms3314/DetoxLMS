import { GRACE_MS, MAX_AWAY_MS, MAX_STRIKES } from "./rules";

/**
 * Pure focus-session state machine.
 *
 * Every function takes the current time as an argument and never reads the
 * clock, so a throttled background tab or a sleeping laptop cannot corrupt the
 * accounting: time is always derived from timestamp differences.
 *
 * Lifecycle: focusing <-> away -> completed | failed | abandoned.
 * There is no voluntary pause. While away, the first GRACE_MS still count as
 * focused time; after that the timer is effectively paused and the time is
 * logged as away time.
 */
export type SessionStatus = "focusing" | "away" | "completed" | "failed" | "abandoned";

export interface FocusSession {
  status: SessionStatus;
  startedAt: number;
  /** Target focus time, or null for an open-ended session. */
  targetMs: number | null;
  /** Time up to which the counters below are accounted. */
  lastAt: number;
  focusedMs: number;
  /** Time spent away beyond the grace period. */
  awayMs: number;
  /** Absences that outlasted the grace period. */
  strikes: number;
  /** When the current absence began; null while focusing. */
  awaySince: number | null;
  endedAt: number | null;
}

export function startSession(now: number, targetMs: number | null): FocusSession {
  return {
    status: "focusing",
    startedAt: now,
    targetMs,
    lastAt: now,
    focusedMs: 0,
    awayMs: 0,
    strikes: 0,
    awaySince: null,
    endedAt: null,
  };
}

export function isActive(s: FocusSession): boolean {
  return s.status === "focusing" || s.status === "away";
}

/** True while away and past the grace period, i.e. the timer is not counting. */
export function isPaused(s: FocusSession, now: number): boolean {
  return s.status === "away" && s.awaySince !== null && now - s.awaySince > GRACE_MS;
}

function finish(s: FocusSession, status: SessionStatus, at: number): FocusSession {
  return { ...s, status, endedAt: at, lastAt: at, awaySince: null };
}

/** Move the counters forward to `now`, applying the completion and failure rules. */
export function advance(s: FocusSession, now: number): FocusSession {
  if (!isActive(s) || now <= s.lastAt) return s;

  if (s.status === "focusing") {
    const dt = now - s.lastAt;
    if (s.targetMs !== null && s.focusedMs + dt >= s.targetMs) {
      const doneAt = s.lastAt + (s.targetMs - s.focusedMs);
      return finish({ ...s, focusedMs: s.targetMs }, "completed", doneAt);
    }
    return { ...s, focusedMs: s.focusedMs + dt, lastAt: now };
  }

  // Away: split the elapsed time into the part inside the grace period (still
  // focus) and the part after it (away).
  const since = s.awaySince ?? s.lastAt;
  const graceLeft = Math.max(0, since + GRACE_MS - s.lastAt);
  const dt = now - s.lastAt;
  const graceDt = Math.min(dt, graceLeft);
  const awayDt = dt - graceDt;

  // The target may be reached while still inside the grace period.
  if (s.targetMs !== null && s.focusedMs + graceDt >= s.targetMs) {
    const doneAt = s.lastAt + (s.targetMs - s.focusedMs);
    return finish({ ...s, focusedMs: s.targetMs }, "completed", doneAt);
  }

  let next: FocusSession = {
    ...s,
    focusedMs: s.focusedMs + graceDt,
    awayMs: s.awayMs + awayDt,
    lastAt: now,
  };

  // The first moment the grace period is exceeded is a strike.
  const wasPaused = s.lastAt - since > GRACE_MS;
  const strikeAt = since + GRACE_MS;
  let failedAt: number | null = null;
  if (!wasPaused && now > strikeAt) {
    next = { ...next, strikes: next.strikes + 1 };
    if (next.strikes >= MAX_STRIKES) failedAt = strikeAt;
  }

  if (next.awayMs >= MAX_AWAY_MS) {
    // Clamp to the moment the away limit was crossed, even if we are only
    // noticing now (a background tab can be throttled for a long time).
    const crossedAt = now - (next.awayMs - MAX_AWAY_MS);
    next = { ...next, awayMs: MAX_AWAY_MS };
    failedAt = failedAt === null ? crossedAt : Math.min(failedAt, crossedAt);
  }

  if (failedAt === null) return next;
  // Only away time up to the failure moment is real.
  const awayUntilFail = Math.max(0, failedAt - Math.max(s.lastAt, strikeAt));
  return finish({ ...next, awayMs: Math.min(MAX_AWAY_MS, s.awayMs + awayUntilFail) }, "failed", failedAt);
}

/** The user left the page, tab or fullscreen. */
export function leave(s: FocusSession, now: number): FocusSession {
  const cur = advance(s, now);
  if (cur.status !== "focusing") return cur;
  return { ...cur, status: "away", awaySince: now };
}

/** The user came back. Brief absences inside the grace period are forgiven. */
export function returnToFocus(s: FocusSession, now: number): FocusSession {
  const cur = advance(s, now);
  if (cur.status !== "away") return cur;
  return { ...cur, status: "focusing", awaySince: null };
}

/** The user ends the session. Hitting the target is `completed`; quitting early is `abandoned`. */
export function end(s: FocusSession, now: number): FocusSession {
  const cur = advance(s, now);
  if (!isActive(cur)) return cur;
  // Open-ended sessions complete whenever the user stops them.
  const status = cur.targetMs === null ? "completed" : "abandoned";
  return finish(cur, status, now);
}

/** Remaining focus time for a fixed-target session, otherwise null. */
export function remainingMs(s: FocusSession): number | null {
  return s.targetMs === null ? null : Math.max(0, s.targetMs - s.focusedMs);
}
