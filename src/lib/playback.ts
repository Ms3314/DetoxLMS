/**
 * Direct localStorage access to the Library's playback state, so the focus
 * screen shares watched flags, resume positions and the last-opened video with
 * the Library view without going through its React state.
 */
const POSITIONS_KEY = "ytch-positions-v1";
const WATCHED_KEY = "ytch-watched-v1";
const SETTINGS_KEY = "ytch-settings-v1";
const LAST_VIDEO_KEY = "ytch-last-video";

function readObject<T extends object>(key: string): T {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function writeObject(key: string, value: object) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable */
  }
}

export const getPosition = (videoId: string): number =>
  readObject<Record<string, number>>(POSITIONS_KEY)[videoId] ?? 0;

export function savePosition(videoId: string, seconds: number) {
  const at = Math.floor(seconds);
  if (at < 1) return;
  const all = readObject<Record<string, number>>(POSITIONS_KEY);
  if (all[videoId] !== at) writeObject(POSITIONS_KEY, { ...all, [videoId]: at });
}

export function clearPosition(videoId: string) {
  const all = readObject<Record<string, number>>(POSITIONS_KEY);
  if (videoId in all) {
    delete all[videoId];
    writeObject(POSITIONS_KEY, all);
  }
}

export function markWatched(videoId: string) {
  writeObject(WATCHED_KEY, { ...readObject<Record<string, boolean>>(WATCHED_KEY), [videoId]: true });
}

export const isWatched = (videoId: string): boolean =>
  Boolean(readObject<Record<string, boolean>>(WATCHED_KEY)[videoId]);

/** Playback settings from the Library toggles; both default to on. */
export function getPlaybackSettings(): { autoplay: boolean; autoMark: boolean } {
  const s = readObject<{ autoplay?: boolean; autoMark?: boolean }>(SETTINGS_KEY);
  return { autoplay: s.autoplay ?? true, autoMark: s.autoMark ?? true };
}

export function setLastVideo(playlistId: string, videoId: string) {
  try {
    window.localStorage.setItem(LAST_VIDEO_KEY, videoId);
    window.localStorage.setItem(`${LAST_VIDEO_KEY}#${playlistId}`, videoId);
  } catch {
    /* ignore */
  }
}

export function getLastVideo(playlistId: string): string | null {
  try {
    return window.localStorage.getItem(`${LAST_VIDEO_KEY}#${playlistId}`);
  } catch {
    return null;
  }
}
