import { DAILY_CAP_MS, MIN_COUNTED_MS } from "./rules";
import type { FocusSession } from "./engine";

/**
 * Focused time this session adds to the hours ledger. Sessions under the
 * minimum add nothing; failed and abandoned sessions still count their
 * focused time.
 */
export function countedMs(s: FocusSession): number {
  return s.focusedMs >= MIN_COUNTED_MS ? s.focusedMs : 0;
}

/** Only completed sessions of at least the minimum length keep a streak alive. */
export function countsForStreak(s: FocusSession): boolean {
  return s.status === "completed" && s.focusedMs >= MIN_COUNTED_MS;
}

/** How much of `addMs` still fits under the daily cap, given what was counted that day. */
export function applyDailyCap(countedTodayMs: number, addMs: number): number {
  return Math.max(0, Math.min(addMs, DAILY_CAP_MS - countedTodayMs));
}

export const RANKS = [
  { name: "Starter", hours: 0 },
  { name: "Focused", hours: 10 },
  { name: "Dedicated", hours: 50 },
  { name: "Scholar", hours: 150 },
  { name: "Master", hours: 500 },
  { name: "Sage", hours: 1000 },
] as const;

export function rankFor(totalMs: number) {
  const hours = totalMs / 3_600_000;
  let current: (typeof RANKS)[number] = RANKS[0];
  for (const r of RANKS) if (hours >= r.hours) current = r;
  const next = RANKS.find((r) => r.hours > current.hours) ?? null;
  return { current, next };
}
