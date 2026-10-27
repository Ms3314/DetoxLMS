import { TOPIC_OPTIONS } from "../lib/workspace";

/** Dropdown for tagging a thought or todo with a course (or General). */
export default function TopicSelect({ value, onChange }) {
  return (
    <select
      className="select"
      aria-label="Topic"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {TOPIC_OPTIONS.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
