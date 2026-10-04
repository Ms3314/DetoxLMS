/** "H:MM:SS", "MM:SS" or "M:SS" -> total seconds. Returns null when unparseable. */
export function parseLength(str) {
  if (!str) return null;
  const parts = String(str)
    .trim()
    .split(":")
    .map((p) => parseInt(p, 10));
  if (parts.some((p) => Number.isNaN(p))) return null;
  let secs = 0;
  for (const p of parts) secs = secs * 60 + p;
  return secs;
}

/** seconds -> "3h 12m" / "45m" / "1m 30s" compact label. */
export function formatSeconds(secs) {
  if (secs == null) return "";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m${s > 0 ? ` ${s}s` : ""}`;
  return `${s}s`;
}

export function totalSeconds(playlist) {
  return playlist.videos.reduce(
    (acc, v) => acc + (parseLength(v.length) ?? 0),
    0
  );
}

export function percentDone(playlist, watched) {
  if (!playlist || !playlist.videos.length) return 0;
  const done = playlist.videos.filter((v) => watched[v.id]).length;
  return Math.round((done / playlist.videos.length) * 100);
}

/** Overall percent across all playlists. */
export function overallProgress(playlists, watched) {
  let total = 0;
  let done = 0;
  for (const pl of playlists) {
    total += pl.videos.length;
    done += pl.videos.filter((v) => watched[v.id]).length;
  }
  return total ? Math.round((done / total) * 100) : 0;
}

export function totalMinutes(playlists) {
  let secs = 0;
  for (const pl of playlists) secs += totalSeconds(pl);
  return Math.round(secs / 60);
}