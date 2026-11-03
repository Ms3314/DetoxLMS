/**
 * Browser-side helpers for the focus lock. A web page cannot truly lock a
 * computer, so this only makes leaving hard and noticeable: fullscreen, Esc
 * capture where the browser allows it, and detection of tab/window/fullscreen
 * exits. Mobile browsers (coarse pointer) skip the fullscreen requirement.
 */
type KeyboardLockApi = { lock?: (keys?: string[]) => Promise<void>; unlock?: () => void };

const keyboardApi = (): KeyboardLockApi | undefined =>
  (navigator as unknown as { keyboard?: KeyboardLockApi }).keyboard;

export function fullscreenSupported(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof document.documentElement.requestFullscreen === "function" &&
    !window.matchMedia("(pointer: coarse)").matches
  );
}

/** "full" = fullscreen + Esc capture, "fullscreen" = fullscreen only, "none" = detection only. */
export type LockLevel = "full" | "fullscreen" | "none";

export function lockLevel(): LockLevel {
  if (!fullscreenSupported()) return "none";
  return typeof keyboardApi()?.lock === "function" ? "full" : "fullscreen";
}

/** Must be called from a click or key handler. Resolves true if fullscreen is active. */
export async function enterFocusFullscreen(): Promise<boolean> {
  if (!fullscreenSupported()) return false;
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  } catch {
    return false;
  }
  try {
    await keyboardApi()?.lock?.(["Escape"]);
  } catch {
    /* Esc capture is a bonus; plain fullscreen still works */
  }
  return Boolean(document.fullscreenElement);
}

export function exitFocusFullscreen() {
  try {
    keyboardApi()?.unlock?.();
    if (document.fullscreenElement) void document.exitFullscreen();
  } catch {
    /* already out */
  }
}

/**
 * Whether the user is still "here". `hasFocus()` stays true while focus sits
 * inside the YouTube iframe, so clicking the player is not treated as leaving.
 */
export function isPresent(requireFullscreen: boolean): boolean {
  if (document.hidden || !document.hasFocus()) return false;
  return !requireFullscreen || Boolean(document.fullscreenElement);
}
