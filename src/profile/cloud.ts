import type { SessionRecord } from "../focus/log";
import { loadLog } from "../focus/log";
import { supabase } from "../lib/supabase";

const SYNCED_KEY = "ytch-focus-synced-v1";

/** A row of the `focus_sessions` table as the database returns it. */
export interface SessionRow {
  local_id: string;
  started_at: string;
  ended_at: string;
  target_seconds: number | null;
  focused_seconds: number;
  away_seconds: number;
  strikes: number;
  status: SessionRecord["status"];
  playlist_id: string;
  video_id: string;
  counted_seconds: number;
}

const toSeconds = (ms: number) => Math.round(ms / 1000);

export function recordToRow(userId: string, r: SessionRecord) {
  const focused = toSeconds(r.focusedMs);
  return {
    user_id: userId,
    local_id: r.id,
    started_at: new Date(r.startedAt).toISOString(),
    ended_at: new Date(r.endedAt).toISOString(),
    target_seconds: r.targetMs === null ? null : toSeconds(r.targetMs),
    focused_seconds: focused,
    away_seconds: toSeconds(r.awayMs),
    strikes: r.strikes,
    // "focusing"/"away" never reach the log, but the column only allows finished states.
    status: r.status === "completed" || r.status === "failed" ? r.status : "abandoned",
    playlist_id: r.playlistId,
    video_id: r.videoId,
    // The database rejects counted > focused, which rounding could otherwise cause.
    counted_seconds: Math.min(focused, toSeconds(r.countedMs)),
  };
}

export function rowToRecord(row: SessionRow): SessionRecord {
  return {
    id: row.local_id,
    startedAt: Date.parse(row.started_at),
    endedAt: Date.parse(row.ended_at),
    targetMs: row.target_seconds === null ? null : row.target_seconds * 1000,
    focusedMs: row.focused_seconds * 1000,
    awayMs: row.away_seconds * 1000,
    strikes: row.strikes,
    status: row.status,
    playlistId: row.playlist_id,
    videoId: row.video_id,
    countedMs: row.counted_seconds * 1000,
  };
}

function readSynced(userId: string): Set<string> {
  try {
    const all = JSON.parse(window.localStorage.getItem(SYNCED_KEY) ?? "{}") as Record<string, string[]>;
    return new Set(all[userId] ?? []);
  } catch {
    return new Set();
  }
}

function markSynced(userId: string, ids: string[]) {
  try {
    const all = JSON.parse(window.localStorage.getItem(SYNCED_KEY) ?? "{}") as Record<string, string[]>;
    all[userId] = [...new Set([...(all[userId] ?? []), ...ids])];
    window.localStorage.setItem(SYNCED_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable: the upload is idempotent, so a retry is harmless */
  }
}

/** Sessions recorded on this device that this account has not uploaded yet. */
export const unsyncedRecords = (userId: string): SessionRecord[] => {
  const synced = readSynced(userId);
  return loadLog().filter((r) => !synced.has(r.id));
};

/** Uploads records. Re-uploading one that already exists is a no-op (unique on user + local id). */
export async function pushRecords(userId: string, records: SessionRecord[]): Promise<void> {
  if (!supabase || records.length === 0) return;
  const { error } = await supabase
    .from("focus_sessions")
    .upsert(records.map((r) => recordToRow(userId, r)), { onConflict: "user_id,local_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  markSynced(userId, records.map((r) => r.id));
}

export async function fetchRecords(userId: string): Promise<SessionRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("focus_sessions")
    .select(
      "local_id, started_at, ended_at, target_seconds, focused_seconds, away_seconds, strikes, status, playlist_id, video_id, counted_seconds"
    )
    .eq("user_id", userId)
    .order("ended_at", { ascending: true })
    .limit(5000);
  if (error) throw new Error(error.message);
  const records = (data as SessionRow[]).map(rowToRecord);
  markSynced(userId, records.map((r) => r.id));
  return records;
}
