import { useLocalStorage } from "../hooks/useLocalStorage";

// One blank page to write on while a video plays, saved automatically.
const PAD_KEY = "ytch-study-pad-v1";

export default function Notepad() {
  const [text, setText] = useLocalStorage(PAD_KEY, "");

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <section className="notepad" aria-label="Notepad">
      <div className="notepad-head">
        <span className="kicker">Notepad</span>
        <span className="page-status">
          {words} {words === 1 ? "word" : "words"} · Saved on this device
        </span>
      </div>
      <textarea
        className="notepad-body"
        placeholder="Write while you watch…"
        aria-label="Notepad body"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </section>
  );
}
