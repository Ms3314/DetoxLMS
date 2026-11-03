import { useCallback, useEffect, useRef, useState } from "react";
import { advance, end, isActive, leave, returnToFocus, startSession } from "./engine";
import {
  clearActive,
  loadActive,
  recordSession,
  saveActive,
  type ActiveSession,
  type SessionRecord,
} from "./log";
import { enterFocusFullscreen, exitFocusFullscreen, fullscreenSupported, isPresent } from "./presence";

const TICK_MS = 250;
const HEARTBEAT_MS = 1000;

/**
 * Runs the focus session in the browser: ticks the engine, turns page
 * visibility / window focus / fullscreen changes into leave and return events,
 * keeps a heartbeat so a refresh can be recovered, and records the finished
 * session in the local history.
 */
export function useFocusSession() {
  const [active, setActive] = useState<ActiveSession | null>(restore);
  const [record, setRecord] = useState<SessionRecord | null>(null);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  const finalizedRef = useRef(false);

  const inProgress = active !== null && isActive(active.session);

  /** Advance the clock and reconcile the session with whether the user is present. */
  const sync = useCallback(() => {
    const t = Date.now();
    setActive((a) => {
      if (!a || !isActive(a.session)) return a;
      let s = advance(a.session, t);
      if (isActive(s)) {
        const present = isPresent(a.requireFs);
        if (!present && s.status === "focusing") s = leave(s, t);
        else if (present && s.status === "away") s = returnToFocus(s, t);
      }
      return s === a.session ? a : { ...a, session: s };
    });
  }, []);

  useEffect(() => {
    if (!inProgress) return;
    const tick = setInterval(sync, TICK_MS);
    const beat = setInterval(() => {
      if (activeRef.current) saveActive(activeRef.current, Date.now());
    }, HEARTBEAT_MS);
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    window.addEventListener("pagehide", sync);
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("fullscreenchange", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("blur", sync);
    return () => {
      clearInterval(tick);
      clearInterval(beat);
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("pagehide", sync);
      document.removeEventListener("visibilitychange", sync);
      document.removeEventListener("fullscreenchange", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("blur", sync);
      // Last heartbeat on the way out (also runs when the view unmounts).
      if (activeRef.current && isActive(activeRef.current.session)) {
        saveActive(activeRef.current, Date.now());
      }
    };
  }, [inProgress, sync]);

  // When the session ends, save it once, drop the heartbeat and release the lock.
  useEffect(() => {
    if (!active || isActive(active.session)) {
      if (!active) finalizedRef.current = false;
      return;
    }
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    setRecord(recordSession(active));
    clearActive();
    exitFocusFullscreen();
  }, [active]);

  const start = useCallback(
    (params: { playlistId: string; videoId: string; targetMs: number | null }) => {
      finalizedRef.current = false;
      setRecord(null);
      setActive({
        session: startSession(Date.now(), params.targetMs),
        playlistId: params.playlistId,
        videoId: params.videoId,
        requireFs: fullscreenSupported() && Boolean(document.fullscreenElement),
      });
    },
    []
  );

  const endNow = useCallback(() => {
    setActive((a) => (a ? { ...a, session: end(a.session, Date.now()) } : a));
  }, []);

  /** Click handler for "return to focus": re-enter fullscreen, then re-check presence. */
  const returnNow = useCallback(async () => {
    await enterFocusFullscreen();
    sync();
  }, [sync]);

  const setVideo = useCallback((playlistId: string, videoId: string) => {
    setActive((a) => (a ? { ...a, playlistId, videoId } : a));
  }, []);

  const dismiss = useCallback(() => {
    setActive(null);
    setRecord(null);
  }, []);

  return { active, record, start, endNow, returnNow, setVideo, dismiss };
}

/**
 * Picks up a session left behind by a refresh or closed tab. The page being
 * gone counts as leaving at the last heartbeat, so the engine's grace, strike
 * and away-limit rules decide whether the session survived.
 */
function restore(): ActiveSession | null {
  const snap = loadActive();
  if (!snap || !isActive(snap.session)) return null;
  const { savedAt, ...rest } = snap;
  const now = Date.now();
  let session = snap.session;
  if (session.status === "focusing") session = leave(session, Math.max(savedAt, session.lastAt));
  return { ...rest, session: advance(session, now) };
}
