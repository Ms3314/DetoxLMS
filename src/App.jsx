import { useLocalStorage } from "./hooks/useLocalStorage";
import VideosView from "./views/VideosView";
import ThoughtsView from "./views/ThoughtsView";
import TodosView from "./views/TodosView";
import "./App.css";

// New keys only: the existing video keys (watched, notes, settings) are untouched.
const VIEW_KEY = "ytch-view-v1";
const TODOS_KEY = "ytch-todos-v1";

const SECTIONS = [
  { id: "videos", label: "Videos" },
  { id: "thoughts", label: "Sami Labs" },
  { id: "todos", label: "Todos" },
];

export default function App() {
  const [view, setView] = useLocalStorage(VIEW_KEY, "videos");
  const [todos, setTodos] = useLocalStorage(TODOS_KEY, []);

  const badge = {
    todos: todos.filter((t) => !t.done).length,
  };

  const activeView = SECTIONS.some((s) => s.id === view) ? view : "videos";

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">▶</span>
          <h1 className="brand-title">Sami Labs</h1>
        </div>

        <nav className="nav" aria-label="Sections">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`nav-tab${activeView === s.id ? " active" : ""}`}
              aria-current={activeView === s.id ? "page" : undefined}
              onClick={() => setView(s.id)}
            >
              {s.label}
              {badge[s.id] > 0 && <span className="nav-count">{badge[s.id]}</span>}
            </button>
          ))}
        </nav>
      </header>

      <div className="app-body">
        {activeView === "videos" && <VideosView />}
        {activeView === "thoughts" && <ThoughtsView />}
        {activeView === "todos" && (
          <TodosView todos={todos} setTodos={setTodos} />
        )}
      </div>
    </div>
  );
}
