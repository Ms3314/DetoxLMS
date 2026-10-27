import { useEffect, useRef } from "react";

const EMBED_BASE = "https://www.youtube-nocookie.com/embed/";
const PROGRESS_INTERVAL_MS = 5000;

let apiPromise = null;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    tag.onerror = () => {
      apiPromise = null;
      reject(new Error("Failed to load YouTube IFrame API"));
    };
    document.head.appendChild(tag);
  });
  return apiPromise;
}

/**
 * Embeds a YouTube video with the IFrame API so we can react to the player
 * ending (autoplay next / auto-mark watched). Falls back to a plain iframe
 * if the API never loads.
 *
 * `startAt` (seconds) is where playback begins. `onProgress(videoId, seconds)`
 * is called every few seconds while the video plays, and once more when the
 * player is torn down, so the position can be resumed later.
 */
export default function Player({ videoId, startAt = 0, onEnded, onReady, onProgress }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const endedCb = useRef(onEnded);
  const readyCb = useRef(onReady);
  const progressCb = useRef(onProgress);
  const startRef = useRef(startAt);

  useEffect(() => {
    endedCb.current = onEnded;
    readyCb.current = onReady;
    progressCb.current = onProgress;
    startRef.current = startAt;
  }, [onEnded, onReady, onProgress, startAt]);

  useEffect(() => {
    let cancelled = false;
    let player = null;
    let timer = null;

    // Reports where the video is now. Only while it is actually playing or
    // paused: while it is still loading or seeking, the time is not a real
    // position and must not replace the saved one. Ended videos are skipped too.
    const saveProgress = () => {
      if (!player?.getCurrentTime || !window.YT) return;
      try {
        const state = player.getPlayerState();
        const hasPosition =
          state === window.YT.PlayerState.PLAYING ||
          state === window.YT.PlayerState.PAUSED;
        if (!hasPosition) return;
        progressCb.current?.(videoId, player.getCurrentTime());
      } catch {
        /* player not ready yet */
      }
    };

    loadYouTubeApi()
      .then(() => {
        if (cancelled || !hostRef.current) return;
        player = new window.YT.Player(hostRef.current, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            autoplay: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            start: Math.floor(startRef.current) || undefined,
          },
          events: {
            onReady: (e) => readyCb.current?.(e.target),
            onStateChange: (e) => {
              if (e.data === window.YT.PlayerState.ENDED) endedCb.current?.();
            },
          },
        });
        playerRef.current = player;
        timer = setInterval(saveProgress, PROGRESS_INTERVAL_MS);
        // Refreshing or closing the tab skips React cleanup, so save on the way out too.
        window.addEventListener("pagehide", saveProgress);
      })
      .catch(() => {
        // Plain iframe fallback — no autoplay-next or resume tracking.
        if (cancelled || !hostRef.current) return;
        const iframe = document.createElement("iframe");
        const start = Math.floor(startRef.current) || 0;
        iframe.src = `${EMBED_BASE}${videoId}?rel=0&modestbranding=1&playsinline=1&autoplay=1&start=${start}`;
        iframe.title = "YouTube video player";
        iframe.frameBorder = "0";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "0";
        hostRef.current.appendChild(iframe);
      });

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("pagehide", saveProgress);
      saveProgress();
      if (player && player.destroy) {
        try {
          player.destroy();
        } catch {
          /* noop */
        }
      }
      playerRef.current = null;
    };
  }, [videoId]);

  return <div ref={hostRef} className="player-host" data-testid="player-host" />;
}
