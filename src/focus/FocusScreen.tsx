import { useState } from "react";
import Player from "../components/Player";
import Notepad from "../components/Notepad";
import { PLAYLISTS } from "../data/playlists";
import {
  clearPosition,
  getPlaybackSettings,
  getPosition,
  markWatched,
  savePosition,
  setLastVideo,
} from "../lib/playback";
import { isPaused, remainingMs, type FocusSession } from "./engine";
import { formatClock, formatDuration } from "./format";
import { loadLog, todayCountedMs, type ActiveSession } from "./log";
import { GRACE_MS, MAX_AWAY_MS, MAX_STRIKES } from "./rules";
import TimerRing from "./TimerRing";

interface Props {
  active: ActiveSession;
  onEnd: () => void;
  onReturn: () => void;
  onSetVideo: (playlistId: string, videoId: string) => void;
}

function endWarning(s: FocusSession): string {
  if (s.targetMs !== null && s.focusedMs < s.targetMs) {
    return `You've focused ${formatDuration(s.focusedMs)} of ${formatDuration(s.targetMs)}. Ending early counts toward your hours (if it's 10 minutes or more) but not your streak.`;
  }
  return `You've focused ${formatDuration(s.focusedMs)} so far.`;
}

/** The locked, fullscreen study layout: timer on top, video and notepad below. */
export default function FocusScreen({ active, onEnd, onReturn, onSetVideo }: Props) {
  const { session, playlistId, videoId } = active;
  const playlist = PLAYLISTS.find((p) => p.id === playlistId) ?? PLAYLISTS[0];
  const index = Math.max(0, playlist.videos.findIndex((v) => v.id === videoId));
  const video = playlist.videos[index];
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [playlistEnded, setPlaylistEnded] = useState(false);

  // Engine time: advances with every tick, so rendering stays pure.
  const now = session.lastAt;
  const [baseToday] = useState(() => todayCountedMs(loadLog(), Date.now()));
  const remaining = remainingMs(session);
  const paused = isPaused(session, now);
  const away = session.status === "away";
  const graceLeft = session.awaySince === null ? 0 : Math.max(0, GRACE_MS - (now - session.awaySince));

  const goTo = (plId: string, vId: string) => {
    setLastVideo(plId, vId);
    setPlaylistEnded(false);
    onSetVideo(plId, vId);
  };

  const handleEnded = () => {
    clearPosition(video.id);
    const { autoplay, autoMark } = getPlaybackSettings();
    if (autoMark) markWatched(video.id);
    const next = playlist.videos[index + 1];
    if (next && autoplay) goTo(playlist.id, next.id);
    else if (!next) setPlaylistEnded(true);
  };

  return (
    <div className="focus-screen">
      <header className="focus-top">
        <div className="focus-timer">
          <TimerRing
            progress={session.targetMs === null ? null : session.focusedMs / session.targetMs}
            time={formatClock(remaining ?? session.focusedMs)}
            caption={remaining === null ? "elapsed" : "left"}
            paused={paused}
          />
          <div className="focus-timer-meta">
            <p className="kicker">{paused ? "Paused" : away ? "Away" : "Focusing"}</p>
            <p className="focus-course">{playlist.name}</p>
            <p className="focus-today">
              Today {formatDuration(baseToday + session.focusedMs)} · Strikes {session.strikes}/{MAX_STRIKES}
            </p>
          </div>
        </div>
        <button type="button" className="btn-ghost danger" onClick={() => setConfirmEnd(true)}>
          End session
        </button>
      </header>

      <div className="focus-body">
        <div className="focus-main">
          <div className="player-wrap">
            <Player
              videoId={video.id}
              startAt={getPosition(video.id)}
              onEnded={handleEnded}
              onProgress={savePosition}
            />
          </div>

          <div className="focus-video-bar">
            <select
              className="select focus-video-select"
              aria-label="Video"
              value={video.id}
              onChange={(e) => goTo(playlist.id, e.target.value)}
            >
              {playlist.videos.map((v, i) => (
                <option key={v.id} value={v.id}>
                  {String(i + 1).padStart(2, "0")} · {v.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-ghost"
              disabled={index === 0}
              onClick={() => goTo(playlist.id, playlist.videos[index - 1].id)}
            >
              ← Prev
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={index === playlist.videos.length - 1}
              onClick={() => goTo(playlist.id, playlist.videos[index + 1].id)}
            >
              Next →
            </button>
          </div>

          {playlistEnded && (
            <div className="focus-card" role="status">
              <p>
                You finished <strong>{playlist.name}</strong>. The timer is still running: keep going with
                notes, or pick another course.
              </p>
              <select
                className="select"
                aria-label="Switch course"
                value=""
                onChange={(e) => {
                  const next = PLAYLISTS.find((p) => p.id === e.target.value);
                  if (next) goTo(next.id, next.videos[0].id);
                }}
              >
                <option value="" disabled>
                  Switch course…
                </option>
                {PLAYLISTS.filter((p) => p.id !== playlist.id).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="focus-notes">
          <Notepad />
        </div>
      </div>

      {away && (
        <div className="focus-overlay" role="alertdialog" aria-labelledby="away-title">
          <div className="focus-dialog">
            <h2 id="away-title" className="view-title">
              {paused ? "Timer paused" : "You left focus"}
            </h2>
            <p>
              {paused
                ? `Away time: ${formatDuration(session.awayMs)} of ${formatDuration(MAX_AWAY_MS)} allowed. Strike ${session.strikes} of ${MAX_STRIKES}.`
                : `Come back within ${Math.ceil(graceLeft / 1000)}s and nothing is lost.`}
            </p>
            <button type="button" className="btn-accent" onClick={onReturn} autoFocus>
              Return to focus
            </button>
          </div>
        </div>
      )}

      {confirmEnd && !away && (
        <div className="focus-overlay" role="alertdialog" aria-labelledby="end-title">
          <div className="focus-dialog">
            <h2 id="end-title" className="view-title">
              End this session?
            </h2>
            <p>{endWarning(session)}</p>
            <div className="focus-dialog-actions">
              <button type="button" className="btn-ghost" onClick={() => setConfirmEnd(false)} autoFocus>
                Keep focusing
              </button>
              <button type="button" className="btn-accent" onClick={onEnd}>
                End session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
