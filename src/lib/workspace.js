import { PLAYLISTS } from "../data/playlists";

/** Topic used when a thought or todo isn't tied to a course. */
export const GENERAL_TOPIC = "general";

export const TOPIC_OPTIONS = [
  { id: GENERAL_TOPIC, name: "General" },
  ...PLAYLISTS.map((p) => ({ id: p.id, name: p.name })),
];

export function topicName(id) {
  return TOPIC_OPTIONS.find((t) => t.id === id)?.name ?? "General";
}

/** Short, collision-resistant id for locally created items. */
export function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function formatTimestamp(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
