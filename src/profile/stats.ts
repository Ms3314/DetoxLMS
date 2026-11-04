import type { SessionRecord } from "../focus/log";
import { MIN_COUNTED_MS } from "../focus/rules";
import { rankFor } from "../focus/stats";

type Entry = Pick<SessionRecord, "endedAt" | "countedMs" | "focusedMs" | "status">;

const DAY_MS = 24 * 60 * 60_000;

/** Local calendar day as "YYYY-MM-DD", so streaks follow the user's own midnight. */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The local day `back` days before `now` (0 = today). Calendar arithmetic, so DST-safe. */
function daysAgo(now: number, back: number): Date {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - back);
}

/** Only completed sessions of at least the minimum length keep a streak alive. */
export function entryCountsForStreak(e: Entry): boolean {
  return e.status === "completed" && e.focusedMs >= MIN_COUNTED_MS;
}

/** Consecutive days with a qualifying session. Today may still be empty without breaking it. */
export function currentStreak(entries: Entry[], now: number): number {
  const days = new Set(entries.filter(entryCountsForStreak).map((e) => dayKey(e.endedAt)));
  let back = days.has(dayKey(now)) ? 0 : 1;
  let streak = 0;
  while (days.has(dayKey(daysAgo(now, back).getTime()))) {
    streak += 1;
    back += 1;
  }
  return streak;
}

export interface DayTotal {
  /** Local midnight timestamp of the day. */
  day: number;
  ms: number;
}

export interface ProfileStats {
  todayMs: number;
  last7Ms: number;
  last30Ms: number;
  totalMs: number;
  sessions: number;
  streak: number;
  /** Oldest first; the last item is today. */
  days: DayTotal[];
  rank: ReturnType<typeof rankFor>;
}

export function profileStats(entries: Entry[], now: number): ProfileStats {
  const perDay = new Map<string, number>();
  let totalMs = 0;
  for (const e of entries) {
    totalMs += e.countedMs;
    const k = dayKey(e.endedAt);
    perDay.set(k, (perDay.get(k) ?? 0) + e.countedMs);
  }

  const days: DayTotal[] = [];
  for (let back = 6; back >= 0; back--) {
    const d = daysAgo(now, back);
    days.push({ day: d.getTime(), ms: perDay.get(dayKey(d.getTime())) ?? 0 });
  }

  const since30 = daysAgo(now, 29).getTime();
  const last30Ms = entries.filter((e) => e.endedAt >= since30).reduce((a, e) => a + e.countedMs, 0);

  return {
    todayMs: days[days.length - 1].ms,
    last7Ms: days.reduce((a, d) => a + d.ms, 0),
    last30Ms,
    totalMs,
    sessions: entries.filter((e) => e.countedMs > 0).length,
    streak: currentStreak(entries, now),
    days,
    rank: rankFor(totalMs),
  };
}

export { DAY_MS };
