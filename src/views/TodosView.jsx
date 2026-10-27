import { useState } from "react";
import TopicSelect from "../components/TopicSelect";
import { GENERAL_TOPIC, newId, topicName } from "../lib/workspace";

const FILTERS = [
  { id: "open", label: "Open" },
  { id: "done", label: "Done" },
  { id: "all", label: "All" },
];

/**
 * Personal todo list, optionally tagged with a course.
 * Stored as an array of { id, text, topic, done, ts } in the parent's state.
 */
export default function TodosView({ todos, setTodos }) {
  const [draft, setDraft] = useState("");
  const [topic, setTopic] = useState(GENERAL_TOPIC);
  const [filter, setFilter] = useState("open");

  const openCount = todos.filter((t) => !t.done).length;
  const doneCount = todos.length - openCount;
  const visible = todos.filter(
    (t) =>
      filter === "all" || (filter === "done" ? t.done : !t.done)
  );

  const addTodo = () => {
    const text = draft.trim();
    if (!text) return;
    setTodos((list) => [...list, { id: newId(), text, topic, done: false, ts: Date.now() }]);
    setDraft("");
  };

  const toggleTodo = (id) => {
    setTodos((list) =>
      list.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const removeTodo = (id) => {
    setTodos((list) => list.filter((t) => t.id !== id));
  };

  const clearDone = () => {
    setTodos((list) => list.filter((t) => !t.done));
  };

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <p className="kicker">Workspace</p>
          <h2 className="view-title">
            Todos{" "}
            <span className="badge-count">
              {openCount} open · {doneCount} done
            </span>
          </h2>
        </div>
        {doneCount > 0 && (
          <button type="button" className="btn-ghost btn-small" onClick={clearDone}>
            Clear done
          </button>
        )}
      </div>

      <form
        className="todo-composer"
        onSubmit={(e) => {
          e.preventDefault();
          addTodo();
        }}
      >
        <input
          className="todo-input"
          type="text"
          placeholder="Add a todo…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <TopicSelect value={topic} onChange={setTopic} />
        <button type="submit" className="btn-accent" disabled={!draft.trim()}>
          Add
        </button>
      </form>

      <div className="filter-row" role="group" aria-label="Filter todos">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`filter-chip${filter === f.id ? " active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="empty-state">
          {todos.length === 0
            ? "Nothing on the list yet. Add your first todo above."
            : filter === "done"
              ? "Nothing finished yet."
              : "All caught up."}
        </p>
      ) : (
        <ul className="todo-list">
          {visible.map((t) => (
            <li key={t.id} className={`todo${t.done ? " done" : ""}`}>
              <button
                type="button"
                className={`todo-check${t.done ? " checked" : ""}`}
                aria-label={t.done ? "Mark as not done" : "Mark as done"}
                aria-pressed={t.done}
                onClick={() => toggleTodo(t.id)}
              >
                {t.done ? "✓" : ""}
              </button>
              <span className="todo-text">{t.text}</span>
              <span className="chip">{topicName(t.topic)}</span>
              <button
                type="button"
                className="note-delete"
                aria-label="Delete todo"
                onClick={() => removeTodo(t.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
