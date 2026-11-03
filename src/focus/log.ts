import { applyDailyCap, countedMs } from "./stats";
import type { FocusSession } from "./engine";

export const LOG_KEY = "ytch-focus-log-v1";
export const ACTIVE_KEY = "ytch-focus-active-v1";

/** One finished session, as kept in the local history. */
export interface SessionRecord {
  id: string;
  startedAt: number;
  endedAt: number;
  targetMs: number | null;
  focusedMs: number;
  awayMs: number;
  strikes: number;
  status: FocusSession["status"];
  playlistId: string;
  videoId: string;
  /** Focused time added to the hours ledger, after the minimum and daily cap. */
  countedMs: number;
}

/** A session in progress plus what it is tied to. */
export interface ActiveSession {
  session: FocusSession;
  playlistId: string;
  videoId: string;
  /** Whether leaving fullscreen counts as leaving focus for this session. */
  requireFs: boolean;
}

export interface ActiveSnapshot extends ActiveSession {
  /** Last heartbeat, so a reload can tell how long the page was gone. */
  savedAt: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw != null) return JSON.parse(raw) as T;
  } catch {
    /* unreadable data: start fresh */
  }
  return fallback;
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable */
  }
}

export const loadLog = (): SessionRecord[] => read<SessionRecord[]>(LOG_KEY, []);

export const loadActive = (): ActiveSnapshot | null => read<ActiveSnapshot | null>(ACTIVE_KEY, null);
export const saveActive = (a: ActiveSession, now: number) =>
  write(ACTIVE_KEY, { ...a, savedAt: now } satisfies ActiveSnapshot);
export function clearActive() {
  try {
    window.localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function todayCountedMs(log: SessionRecord[], now: number): number {
  const from = startOfDay(now);
  return log.filter((r) => r.endedAt >= from).reduce((a, r) => a + r.countedMs, 0);
}

export const totalCountedMs = (log: SessionRecord[]): number =>
  log.reduce((a, r) => a + r.countedMs, 0);

/** Saves a finished session to the history and returns the stored record. */
export function recordSession(a: ActiveSession): SessionRecord {
  const s = a.session;
  const endedAt = s.endedAt ?? s.lastAt;
  const log = loadLog();
  const record: SessionRecord = {
    id: `${s.startedAt.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    startedAt: s.startedAt,
    endedAt,
    targetMs: s.targetMs,
    focusedMs: s.focusedMs,
    awayMs: s.awayMs,
    strikes: s.strikes,
    status: s.status,
    playlistId: a.playlistId,
    videoId: a.videoId,
    countedMs: applyDailyCap(todayCountedMs(log, endedAt), countedMs(s)),
  };
  write(LOG_KEY, [...log, record]);
  return record;
}
