/** Tunable focus-session rules. All durations are in milliseconds. */
export const GRACE_MS = 10_000;
/** A session fails after this many absences longer than the grace period. */
export const MAX_STRIKES = 3;
/** ...or once this much time has been spent away (beyond grace) in total. */
export const MAX_AWAY_MS = 2 * 60_000;
/** Sessions with less focused time than this add nothing to hours or streaks. */
export const MIN_COUNTED_MS = 10 * 60_000;
/** Focused time counted toward hours per calendar day; extra is logged only. */
export const DAILY_CAP_MS = 12 * 60 * 60_000;

export const TARGET_PRESETS_MIN = [25, 45, 60, 90] as const;
