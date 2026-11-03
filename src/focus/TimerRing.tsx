const SIZE = 132;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Props {
  /** 0..1 of the target reached, or null for an open-ended session. */
  progress: number | null;
  time: string;
  caption: string;
  paused?: boolean;
}

/** Circular timer: the time in the middle, a ring that fills toward the target. */
export default function TimerRing({ progress, time, caption, paused = false }: Props) {
  const filled = progress === null ? 1 : Math.min(1, Math.max(0, progress));
  return (
    <div
      className={`timer-ring${paused ? " paused" : ""}${progress === null ? " open" : ""}`}
      role="timer"
      aria-label={`${caption}: ${time}`}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <circle className="timer-ring-track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
        <circle
          className="timer-ring-fill"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - filled)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <div className="timer-ring-text">
        <span className="timer-ring-time">{time}</span>
        <span className="timer-ring-caption">{caption}</span>
      </div>
    </div>
  );
}
