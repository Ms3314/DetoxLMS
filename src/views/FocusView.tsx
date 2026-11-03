import { useEffect, useState } from "react";
import FocusScreen from "../focus/FocusScreen";
import FocusSetup, { type StartParams } from "../focus/FocusSetup";
import FocusSummary from "../focus/FocusSummary";
import { isActive } from "../focus/engine";
import { enterFocusFullscreen, exitFocusFullscreen } from "../focus/presence";
import { useFocusSession } from "../focus/useFocusSession";

const COUNTDOWN_SECONDS = 3;

/** Focus home: set up a session, count in, lock the screen, then summarise. */
export default function FocusView() {
  const { active, record, start, endNow, returnNow, setVideo, dismiss } = useFocusSession();
  const [countdown, setCountdown] = useState<{ left: number; params: StartParams } | null>(null);

  useEffect(() => {
    if (!countdown) return;
    const t = setTimeout(() => {
      if (countdown.left <= 1) {
        start(countdown.params);
        setCountdown(null);
      } else {
        setCountdown({ ...countdown, left: countdown.left - 1 });
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [countdown, start]);

  const begin = (params: StartParams) => {
    // Fullscreen needs this click, so request it before the countdown begins.
    void enterFocusFullscreen();
    setCountdown({ left: COUNTDOWN_SECONDS, params });
  };

  const cancelCountdown = () => {
    exitFocusFullscreen();
    setCountdown(null);
  };

  if (active && isActive(active.session)) {
    return (
      <FocusScreen active={active} onEnd={endNow} onReturn={returnNow} onSetVideo={setVideo} />
    );
  }

  if (countdown) {
    return (
      <div className="focus-screen focus-countdown" role="status" aria-live="polite">
        <p className="kicker">Get ready</p>
        <p className="focus-countdown-number">{countdown.left}</p>
        <button type="button" className="btn-ghost" onClick={cancelCountdown}>
          Cancel
        </button>
      </div>
    );
  }

  if (active) return <FocusSummary active={active} record={record} onDone={dismiss} />;

  return <FocusSetup onStart={begin} />;
}
