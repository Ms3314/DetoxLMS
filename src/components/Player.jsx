import { useEffect, useRef } from "react";

const EMBED_BASE = "https://www.youtube-nocookie.com/embed/";

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
 */
export default function Player({ videoId, onEnded, onReady }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const endedCb = useRef(onEnded);
  const readyCb = useRef(onReady);

  useEffect(() => {
    endedCb.current = onEnded;
    readyCb.current = onReady;
  }, [onEnded, onReady]);

  useEffect(() => {
    let cancelled = false;
    let player = null;

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
          },
          events: {
            onReady: (e) => readyCb.current?.(e.target),
            onStateChange: (e) => {
              if (e.data === window.YT.PlayerState.ENDED) endedCb.current?.();
            },
          },
        });
        playerRef.current = player;
      })
      .catch(() => {
        // Plain iframe fallback — no autoplay-next tracking.
        if (cancelled || !hostRef.current) return;
        const iframe = document.createElement("iframe");
        iframe.src = `${EMBED_BASE}${videoId}?rel=0&modestbranding=1&playsinline=1&autoplay=1`;
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